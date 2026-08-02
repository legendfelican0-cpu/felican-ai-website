import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './main.jsx';

beforeEach(() => window.history.replaceState({}, '', '/'));
afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

describe('Felican AI company site', () => {
  it('renders the Signal direction by default without review controls', () => {
    render(<App />);
    expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute('href', '/');
    expect(screen.getByText(/We build useful AI for the way your business works/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /AI that fits your business/i })).toBeInTheDocument();
    expect(screen.getAllByText('Felican Auto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Relay').length).toBeGreaterThan(0);
    expect(screen.queryByText('CasaSuite')).not.toBeInTheDocument();
    expect(screen.queryByText('Talk to Felican AI')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Call \+1/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Design review')).not.toBeInTheDocument();
  });

  it('presents the phone number as a normal contact link', () => {
    window.history.replaceState({}, '', '/contact');
    render(<App />);
    const phoneLinks = screen.getAllByRole('link', { name: /\+1 \(346\) 515-0361/i });
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+13465150361');
    expect(screen.queryByText(/receptionist/i)).not.toBeInTheDocument();
  });

  it('keeps three distinct directions in private review mode', () => {
    window.history.replaceState({}, '', '/?review=1&v=catalog');
    render(<App />);
    expect(screen.getByText('Choose a direction')).toBeInTheDocument();
    fireEvent.click(screen.getByText('03 Friendly'));
    expect(document.querySelector('.variant-network')).toBeInTheDocument();
  });

  it('keeps the website assistant in Contact Us and answers a product question', () => {
    window.history.replaceState({}, '', '/contact');
    render(<App />);
    fireEvent.click(screen.getByText('Ask Felican AI'));
    fireEvent.click(screen.getByText('What products do you have?'));
    expect(screen.getByText(/Felican products include Felican Auto/i)).toBeInTheDocument();
    expect(screen.getByText(/Relay, the Felican AI Assistant, World of Agents, and BookMaker/i)).toBeInTheDocument();
  });

  it('shows all five products together and opens a dedicated product page', () => {
    window.history.replaceState({}, '', '/products');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Five products. Built for real work.' })).toBeInTheDocument();
    expect(screen.queryByText('Business software')).not.toBeInTheDocument();
    expect(screen.queryByText('Create and automate')).not.toBeInTheDocument();
    expect(screen.queryByText('Current products')).not.toBeInTheDocument();
    ['Felican Auto', 'Relay', 'World of Agents', 'BookMaker'].forEach(name => {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    });
    ['CasaSuite', 'LeadConcierge AI', 'InvestorHQ', 'ThreadPilot', 'AdPulse', 'FrameFire', 'Lumina', 'Dendrite', 'Ora', 'Quorum'].forEach(name => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });

    const bookMakerLink = screen.getByRole('link', { name: 'Open BookMaker' });
    expect(bookMakerLink).toHaveAttribute('href', '/products/bookmaker');
    fireEvent.click(bookMakerLink);
    expect(screen.getByRole('heading', { name: 'BookMaker', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Draft organization')).toBeInTheDocument();
  });

  it('shows Lee Felican Jr.\'s four books with official resource links', () => {
    window.history.replaceState({}, '', '/books');
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

  it('renders dedicated services, about, and contact pages', () => {
    window.history.replaceState({}, '', '/services');
    const { unmount } = render(<App />);
    expect(screen.getByRole('heading', { name: 'AI systems designed around your business.' })).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, '', '/about');
    const about = render(<App />);
    expect(screen.getByRole('heading', { name: 'A family-built AI company.' })).toBeInTheDocument();
    about.unmount();

    window.history.replaceState({}, '', '/contact');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Let’s talk about what needs to work better.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call Felican AI/i })).toHaveAttribute('href', 'tel:+13465150361');
    expect(screen.getByRole('link', { name: /privateaiglobal@gmail.com/i })).toHaveAttribute('href', 'mailto:privateaiglobal@gmail.com');
  });
});
