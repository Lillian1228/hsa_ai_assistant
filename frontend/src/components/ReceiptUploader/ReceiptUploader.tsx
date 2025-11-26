import React, { useState } from 'react';
import { Upload, Button, message, Image, Space } from 'antd';
import { InboxOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { UploadProps, UploadFile } from 'antd';
import { useReceiptUpload } from '@/hooks/useReceiptUpload';
import { useAppStore } from '@/store/useAppStore';
import { useReceiptStore } from '@/store/useReceiptStore';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types';
import './ReceiptUploader.css';

const { Dragger } = Upload;

/**
 * ReceiptUploader Props
 */
interface ReceiptUploaderProps {
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

/**
 * ReceiptUploader Component
 * Handle receipt file upload
 */
export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const navigate = useNavigate();
  const { uploadReceipt, isUploading } = useReceiptUpload();
  const { sessionId, userId } = useAppStore();
  const { setCurrentReceipt } = useReceiptStore();
  const { addMessage } = useChatStore();

  // Get image preview URL
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/jpeg,image/jpg,image/png,.pdf',
    fileList,
    listType: 'picture-card',
    beforeUpload: async (file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        message.error('Only image (JPG, PNG) or PDF files can be uploaded!');
        return Upload.LIST_IGNORE;
      }

      // Validate file size (10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File size cannot exceed 10MB!');
        return Upload.LIST_IGNORE;
      }

      // Generate preview for image file
      if (isImage) {
        const preview = await getBase64(file);
        const uploadFile: UploadFile = {
          uid: file.uid,
          name: file.name,
          status: 'done',
          url: preview,
          originFileObj: file,
        };
        setFileList([uploadFile]);
      } else {
        const uploadFile: UploadFile = {
          uid: file.uid,
          name: file.name,
          status: 'done',
          originFileObj: file,
        };
        setFileList([uploadFile]);
      }

      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([]);
    },
    onPreview: async (file: UploadFile) => {
      if (!file.url && !file.preview) {
        if (file.originFileObj) {
          file.preview = await getBase64(file.originFileObj as File);
        }
      }
      setPreviewImage(file.url || file.preview || '');
      setPreviewOpen(true);
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file');
      return;
    }

    try {
      const file = fileList[0].originFileObj as File;
      
      // Call upload Hook
      const response = await uploadReceipt({
        text: 'Please help me analyze this receipt',
        files: [file],
        session_id: sessionId,
        user_id: userId,
      });

      console.log('Upload response:', response);

      // Display response in chatbox if present
      if (response && response.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
      }

      // Check if response contains receipt review request
      if (response && response.review_request) {
        message.success('Receipt uploaded successfully!');
        
        // Convert ReceiptReviewRequest to ReceiptData format
        const receiptData = {
          receipt_id: response.review_request.receipt_id,
          store_name: response.review_request.store_name,
          date: new Date(response.review_request.date),
          eligible_items: (response.review_request.hsa_eligible_items || []).map((item, index) => ({
            id: `eligible-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: true,
          })),
          non_eligible_items: (response.review_request.non_hsa_eligible_items || []).map((item, index) => ({
            id: `non-eligible-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: false,
          })),
          unsure_items: (response.review_request.unsure_hsa_items || []).map((item, index) => ({
            id: `unsure-${index}`,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            is_eligible: false,
          })),
          payment_card: response.review_request.payment_card,
          card_last_four_digit: response.review_request.card_last_four_digit,
          total_cost: response.review_request.total_cost,
          total_hsa_cost: (response.review_request.hsa_eligible_items || []).reduce((sum, item) => sum + item.price, 0),
          image_url: response.image_url, // Store receipt image URL
        };
        
        // Store receipt data to Store
        setCurrentReceipt(receiptData);
        
        // Call success callback
        onUploadSuccess?.();
        
        // Redirect to review page
        navigate('/review');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error instanceof Error ? error.message : 'Upload failed, please try again');
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
    }
  };

  return (
    <div className="receipt-uploader">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {fileList.length === 0 ? (
          <Dragger {...uploadProps} className="upload-dragger">
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#667eea', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">Click or drag receipt image to this area</p>
            <p className="ant-upload-hint">
              Supports JPG, PNG, PDF formats, single file up to 10MB
            </p>
          </Dragger>
        ) : (
          <div className="preview-section">
            <Upload {...uploadProps} maxCount={1}>
              {fileList.length === 0 && <Button icon={<UploadOutlined />}>Select file</Button>}
            </Upload>
          </div>
        )}

        {fileList.length > 0 && (
          <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={isUploading}
              className="upload-button"
            >
              {isUploading ? 'Uploading...' : 'Upload and analyze receipt'}
            </Button>
            <Button
              size="large"
              icon={<DeleteOutlined />}
              onClick={() => setFileList([])}
              disabled={isUploading}
            >
              Clear
            </Button>
          </Space>
        )}
      </Space>

      {/* Image preview modal */}
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
    </div>
  );
};

