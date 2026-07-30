import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './main.jsx';

beforeEach(() => window.history.replaceState({}, '', '/'));
afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

describe('Felican AI company site', () => {
  it('renders the Signal direction by default without review controls', () => {
    render(<App />);
    expect(screen.getByText(/Practical AI for the work that runs your business/i)).toBeInTheDocument();
    expect(screen.getByText('Relay')).toBeInTheDocument();
    expect(screen.queryByText('Design review')).not.toBeInTheDocument();
  });

  it('positions the company phone AI as Felican’s front desk', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /See the full call flow/i }));
    expect(screen.getByText(/What happens when you call/i)).toBeInTheDocument();
    expect(screen.getByText(/transfer to Legend or Lee/i)).toBeInTheDocument();
    expect(screen.getByText(/Call notes and follow-up details/i)).toBeInTheDocument();
  });

  it('keeps three distinct directions in private review mode', () => {
    window.history.replaceState({}, '', '/?review=1&v=catalog');
    render(<App />);
    expect(screen.getByText('Design review')).toBeInTheDocument();
    fireEvent.click(screen.getByText('03 Network'));
    expect(document.querySelector('.variant-network')).toBeInTheDocument();
  });

  it('opens the website assistant and answers a product question', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Talk to Felican AI'));
    fireEvent.click(screen.getByText('What products do you have?'));
    expect(screen.getByText(/Felican products include Relay/i)).toBeInTheDocument();
  });
});
