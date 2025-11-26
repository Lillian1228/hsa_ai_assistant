import React from 'react';
import { Steps } from 'antd';
import {
  CloudUploadOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import './StepIndicator.css';

export type StepType = 'upload' | 'review' | 'finish';

interface StepIndicatorProps {
  currentStep: StepType;
}

/**
* StepIndicator Component
 * Display which step the user is currently on (upload, review, finish)
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
}) => {
  const stepMap: Record<StepType, number> = {
    upload: 0,
    review: 1,
    finish: 2,
  };

  const current = stepMap[currentStep];

  const steps = [
    {
      title: 'Upload',
      // description: 'Upload',
      icon: <CloudUploadOutlined />,
    },
    {
      title: 'Review',
      // description: 'Review',
      icon: <FileSearchOutlined />,
    },
    {
      title: 'Finish',
      // description: 'Finish',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div className="step-indicator">
      <Steps
        current={current}
        direction="horizontal"
        items={steps}
        className="custom-steps"
      />
    </div>
  );
};

