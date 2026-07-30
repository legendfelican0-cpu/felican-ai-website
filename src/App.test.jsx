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
    expect(screen.getAllByText('Relay').length).toBeGreaterThan(0);
    expect(screen.queryByText('Design review')).not.toBeInTheDocument();
  });

  it('presents the phone number as a normal contact link', () => {
    render(<App />);
    const phoneLinks = screen.getAllByRole('link', { name: /\+1 \(346\) 515-0361/i });
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+13465150361');
    expect(screen.queryByText(/receptionist/i)).not.toBeInTheDocument();
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
    expect(screen.getByText(/World of Agents, BookMaker, and Marketer/i)).toBeInTheDocument();
  });

  it('organizes the current seven-product portfolio into two clear groups', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Business systems' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI products' })).toBeInTheDocument();
    ['Felican Auto', 'World of Agents', 'BookMaker', 'Marketer'].forEach(name => {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    });
    ['LeadConcierge AI', 'InvestorHQ', 'ThreadPilot', 'AdPulse', 'FrameFire', 'Lumina', 'Dendrite', 'Ora', 'Quorum'].forEach(name => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });

  it('shows Lee Felican Jr.\'s four books with official resource links', () => {
    render(<App />);

    const titles = [
      "The Big Balla's Guide to Making Money with AI",
      "Don't Be Replaced",
      'Stop Being Nice to AI',
      'The BIG AI Book',
    ];

    titles.forEach(title => {
      const bookTitle = screen.getByText(title);
      expect(bookTitle).toBeInTheDocument();
      expect(bookTitle.closest('a')).toHaveAttribute(
        'href',
        'https://felican.ai/Lee-Felican-jr/books/resources/',
      );
    });

    expect(screen.getByAltText("The Big Balla's Guide to Making Money with AI cover")).toHaveAttribute(
      'src',
      '/book-big-ballas.jpg',
    );
  });
});
