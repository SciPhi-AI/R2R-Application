import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useState, useEffect, useCallback, forwardRef } from 'react';
import Joyride, { BeaconRenderProps, STATUS } from 'react-joyride';

//
// 1. Define the pulsing animation
//    – Starting at `--accent-base`
//    – Pulsing to `--accent-light`
//    – Returning to `--accent-base`
//
const pulse = keyframes`
  0% {
    background-color: var(--accent-base);
    transform: scale(1);
  }

  50% {
    background-color: var(--accent-light);
    transform: scale(1.5);
  }

  100% {
    background-color: var(--accent-base);
    transform: scale(1);
  }
`;

//
// 2. Create a styled Beacon element
//    – Apply the pulse animation
//    – Give it a circular shape and desired size
//
const Beacon = styled.span`
  animation: ${pulse} 1.5s ease-in-out infinite;
  background-color: var(--accent-base);
  border-radius: 50%;
  display: inline-block;
  height: 1rem;
  width: 1rem;
`;

//
// 3. Forward ref so Joyride can attach behavior
//
export const BeaconComponent = forwardRef<HTMLButtonElement, BeaconRenderProps>(
  (props, ref) => {
    return <Beacon ref={ref} {...props} />;
  }
);

// import {
//     useState,
//     useEffect,
//     useCallback,
//     forwardRef,
//   } from 'react';
//   import styled from '@emotion/styled';
// import { keyframes } from '@emotion/react';

// const pulse = keyframes`
//   0% {
//     transform: scale(1);
//   }

//   55% {
//     background-color: rgba(255, 100, 100, 0.9);
//     transform: scale(1.6);
//   }
// `;

// const Beacon = styled.span`
//   animation: ${pulse} 1s ease-in-out infinite;
//   background-color: rgba(255, 27, 14, 0.6);
//   border-radius: 50%;
//   display: inline-block;
//   height: 3rem;
//   width: 3rem;
// `;
// import Joyride, {
//     BeaconRenderProps,
//     STATUS,
//   } from 'react-joyride'; // Import Joyride + STATUS

// export const BeaconComponent = forwardRef<HTMLButtonElement, BeaconRenderProps>(
//     (props, ref) => {
//       return <Beacon ref={ref} {...props} />;
//     }
//   );
