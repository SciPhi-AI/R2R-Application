import {
    useState,
    useEffect,
    useCallback,
    forwardRef,
  } from 'react';
  import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';


const pulse = keyframes`
  0% {
    transform: scale(1);
  }

  55% {
    background-color: rgba(255, 100, 100, 0.9);
    transform: scale(1.6);
  }
`;


const Beacon = styled.span`
  animation: ${pulse} 1s ease-in-out infinite;
  background-color: rgba(255, 27, 14, 0.6);
  border-radius: 50%;
  display: inline-block;
  height: 3rem;
  width: 3rem;
`;
import Joyride, {
    BeaconRenderProps,
    STATUS,
  } from 'react-joyride'; // Import Joyride + STATUS
  

export const BeaconComponent = forwardRef<HTMLButtonElement, BeaconRenderProps>(
    (props, ref) => {
      return <Beacon ref={ref} {...props} />;
    }
  );
  