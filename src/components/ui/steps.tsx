
import React from 'react';
import { cn } from "@/lib/utils";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-8", className)}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              stepNumber: index + 1,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
Steps.displayName = "Steps";

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  stepNumber?: number;
}

export const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, title, stepNumber, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative pl-8 pb-4", className)}
        {...props}
      >
        <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {stepNumber}
        </div>
        <h3 className="font-medium leading-none tracking-tight mb-2">{title}</h3>
        <div className="text-muted-foreground">{children}</div>
      </div>
    );
  }
);
Step.displayName = "Step";
