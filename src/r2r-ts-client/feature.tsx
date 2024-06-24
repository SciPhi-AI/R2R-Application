import posthog from 'posthog-js';

type AsyncFunction = (...args: any[]) => Promise<any>;

export function feature(operationName: string) {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<AsyncFunction>
  ): TypedPropertyDescriptor<AsyncFunction> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (
      this: any,
      ...args: any[]
    ): Promise<any> {
      try {
        const result = await originalMethod.apply(this, args);
        posthog.capture('OperationComplete', { operation: operationName });
        return result;
      } catch (error: unknown) {
        posthog.capture('OperationError', {
          operation: operationName,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}
