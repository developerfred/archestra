import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderComponentTree } from './DynamicReactRenderer';

// Mock UI components to simplify testing and focus on DynamicReactRenderer's logic
vi.mock('../ui/card', () => ({
  Card: vi.fn((props) => <div data-testid="Card" {...props} />),
  CardContent: vi.fn((props) => <div data-testid="CardContent" {...props} />),
  CardDescription: vi.fn((props) => <div data-testid="CardDescription" {...props} />),
  CardFooter: vi.fn((props) => <div data-testid="CardFooter" {...props} />),
  CardHeader: vi.fn((props) => <div data-testid="CardHeader" {...props} />),
  CardTitle: vi.fn((props) => <div data-testid="CardTitle" {...props} />),
}));

vi.mock('../ui/badge', () => ({
  Badge: vi.fn((props) => <span data-testid="Badge" {...props} />),
}));

vi.mock('../ui/separator', () => ({
  Separator: vi.fn((props) => <hr data-testid="Separator" {...props} />),
}));

describe('renderComponentTree', () => {
  it('should render a single registered component with props', () => {
    const json = JSON.stringify({
      component: 'Card',
      props: {
        className: 'test-class',
        children: 'Hello Card',
      },
    });

    render(renderComponentTree(json));

    const card = screen.getByTestId('Card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('test-class');
    expect(card).toHaveTextContent('Hello Card');
  });

  it('should render nested registered components', () => {
    const json = JSON.stringify({
      component: 'Card',
      props: {
        children: [
          { component: 'CardHeader', props: { children: 'Header' } },
          { component: 'CardContent', props: { children: 'Content' } },
        ],
      },
    });

    render(renderComponentTree(json));

    const card = screen.getByTestId('Card');
    expect(card).toBeInTheDocument();

    const cardHeader = screen.getByTestId('CardHeader');
    expect(cardHeader).toBeInTheDocument();
    expect(cardHeader).toHaveTextContent('Header');

    const cardContent = screen.getByTestId('CardContent');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveTextContent('Content');
  });

  it('should render common HTML elements', () => {
    const json = JSON.stringify({
      component: 'div',
      props: {
        className: 'my-div',
        children: [
          { component: 'p', props: { children: 'Paragraph 1' } },
          { component: 'span', props: { children: 'Span 1' } },
          { component: 'h2', props: { children: 'Title 1' } },
        ],
      },
    });

    render(renderComponentTree(json));

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Span 1')).toBeInTheDocument();
    expect(screen.getByText('Title 1')).toBeInTheDocument();
  });

  it('should handle arrays of primitive children within an element', () => {
    const json = JSON.stringify({
      component: 'ul',
      props: {
        className: 'my-list',
        children: [
          { component: 'li', props: { children: 'Item 1' } },
          { component: 'li', props: { children: 'Item 2' } },
        ],
      },
    });

    render(renderComponentTree(json));

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    const ulElement = screen.getByRole('list');
    expect(ulElement).toBeInTheDocument();
    expect(ulElement).toHaveClass('my-list');
  });

  it('should display an error for an unregistered component', () => {
    const json = JSON.stringify({
      component: 'NonExistentComponent',
      props: {},
    });

    render(renderComponentTree(json));
    expect(screen.getByText("Error: Component 'NonExistentComponent' not found.")).toBeInTheDocument();
  });

  it('should display an error for invalid JSON', () => {
    const invalidJson = '{ component: "Card", props: { children: "Missing quote }';

    render(renderComponentTree(invalidJson));
    expect(screen.getByText("Error: Failed to load component.")).toBeInTheDocument();
  });

  it('should correctly render nested objects as JSON strings if not registered components', () => {
    const complexData = {
      annual: '$9,999',
      monthly: '$999',
    };

    const json = JSON.stringify({
      component: 'CardContent',
      props: {
        // Simulating how DynamicReactRenderer's processedProps would stringify a non-registered object prop
        data: JSON.stringify(complexData, null, 2)
      }
    });

    render(renderComponentTree(json));
    const cardContent = screen.getByTestId('CardContent');
    expect(cardContent).toBeInTheDocument();
    // Expect the `data` prop to be rendered as stringified JSON
    expect(cardContent).toHaveTextContent(JSON.stringify(complexData, null, 2));
  });

  it('should handle arrays of strings as ul li structure within processedProps', () => {
    const featuresList = ['Feature 1', 'Feature 2', 'Feature 3'];
    const json = JSON.stringify({
      component: 'div',
      props: {
        // This simulates a prop that is an array, which `DynamicReactRenderer` converts to a `ul`
        dynamicList: featuresList,
      }
    });

    render(renderComponentTree(json));

    // The `dynamicList` prop will be converted to a <ul> internally by DynamicReactRenderer
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });
});
