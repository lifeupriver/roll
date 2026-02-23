import { describe, it, expect } from 'vitest';
import {
  rollDevelopedEmail,
  printShippedEmail,
  referralInviteEmail,
  circleInviteEmail,
} from '@/lib/email/templates';

describe('email templates — XSS prevention', () => {
  const XSS_PAYLOAD = '<script>alert("xss")</script>';
  const XSS_IMG = '<img src=x onerror=alert(1)>';
  const XSS_EVENT = '" onmouseover="alert(1)" data-x="';

  describe('rollDevelopedEmail', () => {
    it('escapes HTML in roll name', () => {
      const { html, subject } = rollDevelopedEmail(XSS_PAYLOAD, 'Portra 400', 5, []);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(subject).not.toContain('<script>');
    });

    it('escapes HTML in film profile name', () => {
      const { html } = rollDevelopedEmail('My Roll', XSS_IMG, 5, []);
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;img');
    });

    it('escapes attribute injection in roll name', () => {
      const { html } = rollDevelopedEmail(XSS_EVENT, 'Portra 400', 5, []);
      // Quotes are escaped so the attribute context can't be broken out of
      expect(html).toContain('&quot;');
      expect(html).not.toContain('" onmouseover="');
    });
  });

  describe('printShippedEmail', () => {
    it('escapes HTML in roll name', () => {
      const { html, subject } = printShippedEmail(XSS_PAYLOAD, 'https://track.example.com', '2026-03-01');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(subject).not.toContain('<script>');
    });
  });

  describe('referralInviteEmail', () => {
    it('escapes HTML in inviter name', () => {
      const { html, subject } = referralInviteEmail(XSS_PAYLOAD, 'https://roll.photos/signup?ref=abc');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(subject).not.toContain('<script>');
    });

    it('escapes multiple occurrences of inviter name', () => {
      const { html } = referralInviteEmail(XSS_PAYLOAD, 'https://roll.photos/signup?ref=abc');
      // The inviter name appears twice in the template (heading + footer)
      const occurrences = html.split('&lt;script&gt;').length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('circleInviteEmail', () => {
    it('escapes HTML in inviter name', () => {
      const { html } = circleInviteEmail(XSS_PAYLOAD, 'Family Photos', 'https://roll.photos/join/abc');
      expect(html).not.toContain('<script>');
    });

    it('escapes HTML in circle name', () => {
      const { html, subject } = circleInviteEmail('Alice', XSS_PAYLOAD, 'https://roll.photos/join/abc');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(subject).not.toContain('<script>');
    });

    it('escapes both inviter and circle names simultaneously', () => {
      const { html } = circleInviteEmail(XSS_IMG, XSS_PAYLOAD, 'https://roll.photos/join/abc');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
    });
  });

  describe('edge cases', () => {
    it('handles ampersands correctly', () => {
      const { html } = rollDevelopedEmail('Tom & Jerry', 'Portra 400', 5, []);
      expect(html).toContain('Tom &amp; Jerry');
    });

    it('handles single quotes', () => {
      const { html } = rollDevelopedEmail("O'Brien's Roll", 'Portra 400', 5, []);
      expect(html).toContain('O&#039;Brien&#039;s Roll');
    });

    it('handles empty strings gracefully', () => {
      const { html } = rollDevelopedEmail('', '', 0, []);
      expect(html).toBeDefined();
    });
  });
});
