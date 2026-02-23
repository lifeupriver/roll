function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Roll</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Arial, Helvetica, sans-serif; color: #1A1612;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: bold; color: #1A1612;">Roll</span>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 8px; padding: 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="font-size: 12px; color: #9A9590; margin: 0;">
                Roll &mdash; Your film, developed digitally.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto;">
  <tr>
    <td align="center" style="background-color: #C45D3E; border-radius: 6px;">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export function magicLinkEmail(url: string): { subject: string; html: string } {
  const content = `
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1A1612; margin: 0 0 16px;">
      Sign in to Roll
    </h1>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      Click the button below to sign in to your Roll account. This link will expire in 15 minutes.
    </p>
    ${ctaButton('Sign in', url)}
    <p style="font-size: 13px; line-height: 1.5; color: #9A9590; margin: 0;">
      If you didn&rsquo;t request this link, you can safely ignore this email.
    </p>`;

  return {
    subject: 'Sign in to Roll',
    html: emailWrapper(content),
  };
}

export function rollDevelopedEmail(
  rollName: string,
  filmProfile: string,
  photoCount: number,
  previewUrls: string[]
): { subject: string; html: string } {
  const previews = previewUrls
    .slice(0, 4)
    .map(
      (url) =>
        `<td style="width: 25%; padding: 4px;">
          <img src="${url}" alt="Photo preview" width="125" style="display: block; width: 100%; height: auto; border-radius: 4px;" />
        </td>`
    )
    .join('');

  const content = `
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1A1612; margin: 0 0 16px;">
      Your roll is ready
    </h1>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      <strong>${escapeHtml(rollName)}</strong> has been developed with the <strong>${escapeHtml(filmProfile)}</strong> profile. ${photoCount} photo${photoCount === 1 ? '' : 's'} ${photoCount === 1 ? 'is' : 'are'} ready to view.
    </p>
    ${
      previews
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>${previews}</tr>
          </table>`
        : ''
    }
    ${ctaButton('View your photos', `https://roll.photos`)}`;

  return {
    subject: `Your roll "${escapeHtml(rollName)}" is ready`,
    html: emailWrapper(content),
  };
}

export function printShippedEmail(
  rollName: string,
  trackingUrl: string,
  estimatedDelivery: string
): { subject: string; html: string } {
  const content = `
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1A1612; margin: 0 0 16px;">
      Your prints are on the way
    </h1>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      Prints from <strong>${escapeHtml(rollName)}</strong> have shipped and are headed your way.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #FAF7F2; border-radius: 6px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="font-size: 14px; color: #9A9590; margin: 0 0 4px;">Estimated delivery</p>
          <p style="font-size: 16px; font-weight: 600; color: #1A1612; margin: 0;">${estimatedDelivery}</p>
        </td>
      </tr>
    </table>
    ${ctaButton('Track shipment', trackingUrl)}`;

  return {
    subject: `Your prints from "${escapeHtml(rollName)}" have shipped`,
    html: emailWrapper(content),
  };
}

export function referralInviteEmail(
  inviterName: string,
  signupUrl: string
): { subject: string; html: string } {
  const content = `
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1A1612; margin: 0 0 16px;">
      ${escapeHtml(inviterName)} thinks you&rsquo;ll love Roll
    </h1>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      Roll rescues your photos from the digital graveyard. Upload your camera roll, we remove the junk, you pick your best 36 shots, choose a film stock, and get real prints delivered to your door.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      Your first roll of prints is <strong>completely free</strong> &mdash; no credit card required.
    </p>
    ${ctaButton('Try Roll free', signupUrl)}
    <p style="font-size: 13px; line-height: 1.5; color: #9A9590; margin: 0;">
      If you don&rsquo;t know ${escapeHtml(inviterName)}, you can safely ignore this email.
    </p>`;

  return {
    subject: `${escapeHtml(inviterName)} invited you to try Roll — your first prints are free`,
    html: emailWrapper(content),
  };
}

export function circleInviteEmail(
  inviterName: string,
  circleName: string,
  inviteUrl: string
): { subject: string; html: string } {
  const content = `
    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #1A1612; margin: 0 0 16px;">
      You&rsquo;re invited to a circle
    </h1>
    <p style="font-size: 16px; line-height: 1.6; color: #1A1612; margin: 0 0 8px;">
      <strong>${escapeHtml(inviterName)}</strong> invited you to join <strong>${escapeHtml(circleName)}</strong> on Roll. Circles are shared spaces where you can view and contribute photos together.
    </p>
    ${ctaButton('Join circle', inviteUrl)}
    <p style="font-size: 13px; line-height: 1.5; color: #9A9590; margin: 0;">
      If you don&rsquo;t know ${escapeHtml(inviterName)}, you can safely ignore this email.
    </p>`;

  return {
    subject: `${escapeHtml(inviterName)} invited you to "${escapeHtml(circleName)}" on Roll`,
    html: emailWrapper(content),
  };
}
