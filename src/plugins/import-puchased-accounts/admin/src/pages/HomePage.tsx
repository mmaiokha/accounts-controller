import React, { useState } from 'react';
import { Main, Box, Typography, Button, TextInput, Alert, Flex } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation';

interface FieldMapping {
  fieldName: string;
  position: number | null;
}

interface ImportResponse {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
}

const AVAILABLE_FIELDS = [
  { value: 'login', label: 'Login' },
  { value: 'email', label: 'Email' },
  { value: 'plainPassword', label: 'Plain Password' },
  { value: 'emailPlainPassword', label: 'Email Plain Password' },
  { value: 'facebookId', label: 'Facebook ID' },
  { value: 'useragent', label: 'User Agent' },
  { value: 'cookie', label: 'Cookie' },
  { value: 'twoFaToken', label: '2FA Token' },
];

const HomePage = () => {
  const { formatMessage } = useIntl();

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState('|');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(
    AVAILABLE_FIELDS.map((field) => ({ fieldName: field.value, position: null }))
  );

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid .txt file');
      setFile(null);
    }
  };

  const handleFieldMappingChange = (fieldName: string, position: string) => {
    const positionNumber = position === '' ? null : parseInt(position, 10);
    setFieldMappings((prev) =>
      prev.map((mapping) =>
        mapping.fieldName === fieldName ? { ...mapping, position: positionNumber } : mapping
      )
    );
  };

  const validateForm = (): boolean => {
    if (!file) {
      setError('Please select a file to upload');
      return false;
    }

    if (!separator.trim()) {
      setError('Please specify a field separator');
      return false;
    }

    const hasValidMappings = fieldMappings.some((mapping) => mapping.position !== null);
    if (!hasValidMappings) {
      setError('Please specify at least one field mapping');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('separator', separator);

      // Only include mappings with positions
      const validMappings = fieldMappings
        .filter((mapping) => mapping.position !== null)
        .map((mapping) => ({
          fieldName: mapping.fieldName,
          position: mapping.position,
        }));

      formData.append('fieldsMapping', JSON.stringify(validMappings));

      const response = await fetch('/api/fb-accounts/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Import completed successfully',
          imported: data.imported || 0,
          failed: data.failed || 0,
        });
        // Reset form
        setFile(null);
        setFieldMappings(
          AVAILABLE_FIELDS.map((field) => ({ fieldName: field.value, position: null }))
        );
        setSeparator('|');
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSeparator('|');
    setFieldMappings(AVAILABLE_FIELDS.map((field) => ({ fieldName: field.value, position: null })));
    setError(null);
    setResult(null);
  };

  return (
    <Main>
      <Box padding={8} width={'50%'} style={{ justifySelf: 'center' }}>
        <Typography variant="alpha" textColor="white" marginBottom={6}>
          Import purchased accounts from text files
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box marginBottom={6}>
            {/* Separator Section */}
            <Box padding={4} background="neutral100" borderRadius="4px" marginBottom={2}>
              <Typography variant="pi" marginBottom={'12px'}>
                Field Separator
              </Typography>
              <TextInput
                placeholder="Enter separator (e.g., |, ;, ,)"
                value={separator}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeparator(e.target.value)}
              />
            </Box>

            {/* Field Mapping Section */}
            <Box
              padding={4}
              background="neutral100"
              borderRadius="4px"
              marginBottom={2}
              display={'block'}
            >
              <Typography variant="beta" display={'block'}>
                Field Mapping
              </Typography>

              <Typography variant="pi" textColor="neutral600" marginBottom={3} display={'block'}>
                Map each field to its position in your file (0-based index). Leave empty to skip.
              </Typography>

              <Flex direction="column" gap={5}>
                {AVAILABLE_FIELDS.map((field) => {
                  const mapping = fieldMappings.find((m) => m.fieldName === field.value);
                  return (
                    <Flex key={field.value} alignItems="center" gap={3} width={'100%'}>
                      <Box width={'100%'}>
                        <Typography variant="pi" marginBottom={1} display={'block'}>
                          {field.label}
                        </Typography>
                        <TextInput
                          type="number"
                          placeholder="Position"
                          value={mapping?.position?.toString() || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleFieldMappingChange(field.value, e.target.value)
                          }
                          min="0"
                        />
                      </Box>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>

            {/* File Upload Section */}
            <Box padding={4} background="neutral100" borderRadius="4px" marginBottom={4}>
              <Typography variant="beta" marginBottom={3} display={'block'}>
                File Upload
              </Typography>
              <Box
                style={{
                  borderRadius: '4px',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifySelf: 'center',
                    }}
                  >
                    {!file && (
                      <Upload style={{ width: '2rem', height: '2rem', marginRight: '5px' }} />
                    )}

                    <Typography variant="delta">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </Typography>
                  </div>

                  <Typography variant="pi" textColor="neutral600" display={'block'} marginTop={1}>
                    Only .txt files are accepted
                  </Typography>
                </label>
              </Box>
            </Box>

            {/* Actions */}
            <Flex padding={4} gap={4} marginBottom={4}>
              <Button type="submit" loading={isLoading} disabled={!file || isLoading} size="L">
                {isLoading ? 'Importing...' : 'Import Accounts'}
              </Button>

              <Button variant="tertiary" onClick={resetForm} disabled={isLoading} size="L">
                Reset Form
              </Button>
            </Flex>

            {/* Results/Errors */}
            {error && (
              <Box marginBottom={4}>
                <Alert closeLabel="Close" title="Error" variant="danger">
                  {error}
                </Alert>
              </Box>
            )}

            {result && (
              <Box marginBottom={4}>
                <Alert
                  closeLabel="Close"
                  title={result.success ? 'Import Successful' : 'Import Failed'}
                  variant={result.success ? 'success' : 'danger'}
                  onClose={() => setResult(null)}
                >
                  <Typography>{result.message}</Typography>
                  {result.success && (
                    <Box paddingTop={2}>
                      <Typography variant="omega">
                        ✅ Successfully imported: {result.imported} accounts
                      </Typography>
                      {result.failed > 0 && (
                        <Typography variant="omega" textColor="danger600">
                          ❌ Failed to import: {result.failed} accounts
                        </Typography>
                      )}
                    </Box>
                  )}
                </Alert>
              </Box>
            )}
          </Box>
        </form>
      </Box>
    </Main>
  );
};

export { HomePage };
