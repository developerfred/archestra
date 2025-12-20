"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';

// A registry of components that can be dynamically rendered
// Add more components here as needed, by importing them.
const componentRegistry: Record<string, React.ElementType> = {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  // Adicione outros componentes da UI aqui
};

interface DynamicReactRendererProps {
  componentName: string;
  props: Record<string, unknown>;
}

export function DynamicReactRenderer({ componentName, props }: DynamicReactRendererProps) {
  const Component = componentRegistry[componentName];

  if (!Component) {
    console.error(`Component '${componentName}' not found in registry.`);
    return <div className="text-destructive">Error: Component '{componentName}' not found.</div>;
  }

  // Renders nested objects as formatted JSON strings if they are not registered components.
  const processedProps: Record<string, unknown> = {};
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      const value = props[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !componentRegistry[key]) {
        processedProps[key] = JSON.stringify(value, null, 2);
      } else if (Array.isArray(value)) {
        processedProps[key] = (
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {(value as Array<string>).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
      }
      else {
        processedProps[key] = value;
      }
    }
  }

  return React.createElement(Component, processedProps);
}

// Helper to deserialize and render the JSON representing the component tree
export function renderComponentTree(jsonTree: string): React.ReactNode {
  try {
    const data = JSON.parse(jsonTree);
    if (data.component && componentRegistry[data.component]) {
      return React.createElement(
        DynamicReactRenderer,
        { componentName: data.component, props: data.props }
      );
    } else if (Array.isArray(data)) {
        // If it's an array, try to render each item.
        return (
            <>
                {data.map((item, index) => {
                    if (item.component && componentRegistry[item.component]) {
                        return React.createElement(
                            DynamicReactRenderer,
                            { componentName: item.component, props: item.props, key: index }
                        );
                    } else if (typeof item === 'string' || typeof item === 'number') {
                        return <span key={index}>{item}</span>;
                    }
                    return null;
                })}
            </>
        );
    }
    return <div className="text-destructive">Error: Invalid component format.</div>;
  } catch (error) {
    console.error("Failed to parse component JSON:", error);
    return <div className="text-destructive">Error: Failed to load component.</div>;
  }
}
