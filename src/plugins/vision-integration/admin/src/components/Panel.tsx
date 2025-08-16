import type { PanelComponent, PanelComponentProps } from '@strapi/content-manager/strapi-admin';
import { Button, Flex, Typography } from '@strapi/design-system';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { TOTP } from 'totp-generator';

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

  const [account, setAccount] = useState(document);

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
  }, [account?.twoFaToken]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const createProfile = async () => {
    const data = await axios
      .post(`/api/fb-accounts/${documentId}/create-vision-profile`, {}, {})
      .then((result) => result.data);

    setAccount({ ...account, visionProfileId: data.visionProfileId });
  };

  const syncAndDeleteProfile = async () => {
    await axios.delete(`/api/fb-accounts/${documentId}/vision-profile-sync-and-delete`);

    setAccount({ ...account, visionProfileId: null });
  };

  const updateActivity = async () => {
    const profile = axios
      .put(`/api/fb-accounts/${documentId}`, { data: { lastActivityAt: new Date() } })
      .then((res) => res.data.data);

    setAccount(profile);
  };

  const result: any = {};

  result.title = 'Facebook Account Panel';
  result.content = (
    <>
      <Button onClick={createProfile} style={{ width: '100%' }}>
        Create Vision Profile
      </Button>

      <Button onClick={updateActivity} style={{ width: '100%' }} color={'danger'}>
        Update Last Activity
      </Button>

      <Button
        onClick={syncAndDeleteProfile}
        style={{ width: '100%', background: "#ee5e52", border: "1px solid #ee5e52" }}
        background={"danger"}
        disabled={!account?.visionProfileId}
      >
        Sync And Delete Profile
      </Button>

      {account?.twoFaToken ? (
        <Flex direction="column" alignItems="center" paddingTop={4} width={'100%'}>
          <Typography variant="beta" style={{ cursor: 'pointer' }} onClick={copyCode}>
            2FA Code: {code || '—'}
          </Typography>
          <Typography variant="pi" textColor="neutral600">
            {copied ? 'Copied!' : `${timeLeft}s`}
          </Typography>
        </Flex>
      ) : null}
    </>
  );
  return result;
};
