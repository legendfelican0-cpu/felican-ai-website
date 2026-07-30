import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './main.jsx';

afterEach(cleanup);

describe('Felican AI concept site', () => {
  it('renders the default Broadsheet concept', () => {
    render(<App />);
    expect(screen.getByText(/We build the AI that answers your phone/i)).toBeInTheDocument();
    expect(screen.getByText('Relay')).toBeInTheDocument();
  });

  it('switches to the Workbench concept', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Workbench'));
    expect(screen.getByText('AI that clocks in.')).toBeInTheDocument();
  });

  it('opens the website assistant and answers a product question', () => {
    render(<App />);
    fireEvent.click(screen.getAllByText('Ask Felican AI')[0]);
    fireEvent.click(screen.getByText('What do you build?'));
    expect(screen.getByText(/We build agents and automations/i)).toBeInTheDocument();
  });
});
