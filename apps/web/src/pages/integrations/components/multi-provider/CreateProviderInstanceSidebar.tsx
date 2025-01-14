import { ActionIcon, Group, Radio, Text } from '@mantine/core';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ICreateIntegrationBodyDto, IProviderConfig } from '@novu/shared';

import { colors, NameInput, Button, Sidebar } from '../../../../design-system';
import { ArrowLeft } from '../../../../design-system/icons';
import { inputStyles } from '../../../../design-system/config/inputs.styles';
import { useFetchEnvironments } from '../../../../hooks/useFetchEnvironments';
import { useSegment } from '../../../../components/providers/SegmentProvider';
import { createIntegration } from '../../../../api/integration';
import { IntegrationsStoreModalAnalytics } from '../../constants';
import { errorMessage, successMessage } from '../../../../utils/notifications';
import { QueryKeys } from '../../../../api/query.keys';
import { ProviderImage } from './SelectProviderSidebar';
import { CHANNEL_TYPE_TO_STRING } from '../../../../utils/channels';
import { IntegrationEntity } from '../../IntegrationsStorePage';

export function CreateProviderInstanceSidebar({
  onClose,
  provider,
  onGoBack,
}: {
  onClose: () => void;
  onGoBack: () => void;
  provider: IProviderConfig;
}) {
  const { environments, isLoading: areEnvironmentsLoading } = useFetchEnvironments();
  const queryClient = useQueryClient();
  const segment = useSegment();
  const navigate = useNavigate();

  const { mutateAsync: createIntegrationApi, isLoading: isLoadingCreate } = useMutation<
    IntegrationEntity,
    { error: string; message: string; statusCode: number },
    ICreateIntegrationBodyDto
  >(createIntegration);

  const { handleSubmit, control, reset } = useForm({
    shouldUseNativeValidation: false,
    defaultValues: {
      name: '',
      environmentId: '',
    },
  });

  const onCreateIntegrationInstance = async (data) => {
    try {
      const { _id: integrationId } = await createIntegrationApi({
        providerId: provider?.id,
        channel: provider.channel,
        name: data.name,
        credentials: {},
        active: false,
        check: false,
        _environmentId: data.environmentId,
      });

      segment.track(IntegrationsStoreModalAnalytics.CREATE_INTEGRATION_INSTANCE, {
        providerId: provider?.id,
        channel: provider?.channel,
        name: data.name,
        environmentId: data.environmentId,
      });
      await queryClient.refetchQueries({
        predicate: ({ queryKey }) => queryKey.includes(QueryKeys.integrationsList),
      });

      successMessage('Instance configuration is created');

      navigate(`/integrations/${integrationId}`);
    } catch (e: any) {
      errorMessage(e.message || 'Unexpected error');
    }
  };

  useEffect(() => {
    if (!environments?.length) {
      return;
    }

    reset({
      name: provider.displayName,
      environmentId: environments.find((env) => env.name === 'Development')?._id || '',
    });
  }, [environments, provider]);

  return (
    <Sidebar
      isOpened
      isLoading={areEnvironmentsLoading}
      onSubmit={handleSubmit(onCreateIntegrationInstance)}
      onClose={onClose}
      customHeader={
        <Group spacing={12} w="100%" h={40}>
          <ActionIcon onClick={onGoBack} variant={'transparent'}>
            <ArrowLeft color={colors.B80} />
          </ActionIcon>
          <ProviderImage providerId={provider.id} />
          <Controller
            control={control}
            name="name"
            defaultValue=""
            render={({ field }) => {
              return (
                <NameInput
                  {...field}
                  value={field.value !== undefined ? field.value : provider.displayName}
                  data-test-id="provider-instance-name"
                  placeholder="Enter instance name"
                  ml={-10}
                />
              );
            }}
          />
        </Group>
      }
      customFooter={
        <Group ml="auto">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={areEnvironmentsLoading || isLoadingCreate} loading={isLoadingCreate} submit>
            Create
          </Button>
        </Group>
      }
    >
      <Text color={colors.B40}>
        Specify assignment preferences to automatically allocate the provider instance to the{' '}
        {CHANNEL_TYPE_TO_STRING[provider.channel]} channel.
      </Text>
      <Controller
        control={control}
        name={'environmentId'}
        defaultValue="Development"
        render={({ field }) => {
          return (
            <Radio.Group
              styles={inputStyles}
              sx={{
                ['.mantine-Group-root']: {
                  paddingTop: 0,
                  paddingLeft: '10px',
                },
              }}
              label="Environment"
              description="Provider instance executes only for"
              spacing={26}
              {...field}
            >
              {environments
                ?.map((environment) => {
                  return { value: environment._id, label: environment.name };
                })
                .map((option) => (
                  <Radio
                    styles={() => ({
                      radio: {
                        backgroundColor: 'transparent',
                        borderColor: colors.B60,
                        '&:checked': { borderColor: 'transparent' },
                      },
                      label: {
                        paddingLeft: 10,
                        fontSize: '14px',
                        fontWeight: 400,
                      },
                    })}
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
                ))}
            </Radio.Group>
          );
        }}
      />
    </Sidebar>
  );
}
