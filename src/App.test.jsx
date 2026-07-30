import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './main.jsx';

beforeEach(() => window.history.replaceState({}, '', '/'));
afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

describe('Felican AI concept site', () => {
  it('renders the straightforward Workbench concept by default', () => {
    render(<App />);
    expect(screen.getByText(/AI systems for real business work/i)).toBeInTheDocument();
    expect(screen.getByText('Relay')).toBeInTheDocument();
    expect(screen.queryByText('Claude directions')).not.toBeInTheDocument();
  });

  it('positions the company phone AI as Felican’s front desk', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /See the call flow/i }));
    expect(screen.getByText(/Our AI answers first/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer the caller/i)).toBeInTheDocument();
    expect(screen.getByText(/Email the details/i)).toBeInTheDocument();
  });

  it('switches to the Workbench concept', () => {
    window.history.replaceState({}, '', '/?review=1&v=broadsheet');
    render(<App />);
    fireEvent.click(screen.getByText('Workbench'));
    expect(screen.getByText('AI systems for real business work.')).toBeInTheDocument();
  });

  it('opens the website assistant and answers a product question', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Ask about our work'));
    fireEvent.click(screen.getByText('What do you build?'));
    expect(screen.getByText(/We build agents and automations/i)).toBeInTheDocument();
  });
});
