import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin';
import { Button, Flex, Typography } from '@strapi/design-system';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { authenticator } from 'otplib';
import { Buffer } from 'buffer';
import { TOTP } from 'totp-generator';
// window.Buffer = Buffer;

// TODO: Refactor this page
export const Panel: PanelComponent = ({
  activeTab,
  collectionType,
  document,
  documentId,
  meta,
  model,
}: PanelComponentProps) => {
  if (model !== 'api::fb-account.fb-account') {
    return null;
  }

  // Define variables
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!document?.twoFaToken) return;

    const updateCode = () => {
      const { otp, expires } = TOTP.generate(document.twoFaToken);
      const remaining = Math.floor((expires - Date.now()) / 1000);
      setCode(otp);
      setTimeLeft(remaining);
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => clearInterval(interval);
  }, [document?.twoFaToken]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const createProfile = async () => {
    return axios.post(`/api/fb-accounts/${documentId}/create-vision-profile`, {}, {});
  };

  const syncProfile = async () => {
    return axios.post(`/api/fb-accounts/${documentId}/vision-profile-sync`, {}, {});
  };

  const syncAndDeleteProfile = async () => {
    return axios.delete(`/api/fb-accounts/${documentId}/vision-profile-sync-and-delete`);
  };

  const updateActivity = async () => {
    return axios.put(`/api/fb-accounts/${documentId}`, { data: { lastActivityAt: new Date() } });
  };

  const result: any = {};

  result.title = 'Facebook Account Panel';
  result.content = (
    <>
      <Button onClick={createProfile} style={{ width: '100%' }}>
        Create Vision Profile
      </Button>

      <Button
        onClick={syncAndDeleteProfile}
        style={{ width: '100%' }}
        color={'danger'}
        disabled={!document?.visionProfileId}
      >
        Sync And Delete Profile
      </Button>

      <Button
        onClick={updateActivity}
        style={{ width: '100%' }}
        color={'danger'}
      >
        Update Last Activity
      </Button>

      {document?.twoFaToken ? (
        <Flex direction="column" alignItems="center" paddingTop={4} width={'100%'}>
          <Typography variant="beta" style={{ cursor: 'pointer' }} onClick={copyCode}>
            2FA Code: {code || '—'}
          </Typography>
          <Typography variant="pi" textColor="neutral600">
            {copied ? 'Скопировано!' : `Обновление через: ${timeLeft}s`}
          </Typography>
        </Flex>
      ) : (
        <Typography variant="pi">Нет настроенного 2FA секрета</Typography>
      )}
    </>
  );
  return result;
};
