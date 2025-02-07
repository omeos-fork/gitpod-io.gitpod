/**
 * Copyright (c) 2025 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License.AGPL.txt in the project root for license information.
 */

import { PlainMessage } from "@bufbuild/protobuf";
import type { OrganizationSettings_OnboardingSettings_WelcomeMessage } from "@gitpod/public-api/lib/gitpod/v1/organization_pb";
import { SwitchInputField } from "@podkit/switch/Switch";
import { Heading3, Subheading } from "@podkit/typography/Headings";
import { useCallback, useState } from "react";
import { InputField } from "../../components/forms/InputField";
import { useToast } from "../../components/toasts/Toasts";
import { useIsOwner } from "../../data/organizations/members-query";
import { useOrgSettingsQuery } from "../../data/organizations/org-settings-query";
import {
    UpdateOrganizationSettingsArgs,
    useUpdateOrgSettingsMutation,
} from "../../data/organizations/update-org-settings-mutation";
import { ConfigurationSettingsField } from "../../repositories/detail/ConfigurationSettingsField";
import { UpdateTeamSettingsOptions } from "../TeamOnboarding";
import { WelcomeMessageEditorModal } from "./WelcomeMessageEditor";
import { WelcomeMessagePreview } from "./WelcomeMessagePreview";

export const gitpodWelcomeSubheading =
    `Gitpod’s sandboxed, ephemeral development environments enable you to use your existing tools without worrying about vulnerabilities impacting their local machines.` as const;

type Props = {
    handleUpdateTeamSettings: (
        newSettings: UpdateOrganizationSettingsArgs,
        options?: UpdateTeamSettingsOptions,
    ) => Promise<void>;
};
export const WelcomeMessageConfigurationField = ({ handleUpdateTeamSettings }: Props) => {
    const { data: settings } = useOrgSettingsQuery();
    const { toast } = useToast();
    const isOwner = useIsOwner();
    const updateTeamSettings = useUpdateOrgSettingsMutation();

    const [welcomeMessageEditorOpen, setWelcomeMessageEditorOpen] = useState(false);

    const handleUpdateWelcomeMessage = useCallback(
        async (
            newSettings: PlainMessage<OrganizationSettings_OnboardingSettings_WelcomeMessage>,
            options?: UpdateTeamSettingsOptions,
        ) => {
            await handleUpdateTeamSettings(
                {
                    onboardingSettings: {
                        welcomeMessage: {
                            ...settings?.onboardingSettings?.welcomeMessage,
                            ...newSettings,
                        },
                    },
                },
                options,
            );
        },
        [handleUpdateTeamSettings, settings?.onboardingSettings?.welcomeMessage],
    );

    return (
        <ConfigurationSettingsField>
            <Heading3>Welcome message</Heading3>
            <Subheading>
                A welcome message to your organization members. This message will be shown to your organization members
                once they sign up and join your organization.
            </Subheading>

            <InputField
                label="Enabled"
                hint={<>Enable showing the message to new organization members.</>}
                id="show-welcome-message"
            >
                <SwitchInputField
                    id="show-welcome-message"
                    checked={settings?.onboardingSettings?.welcomeMessage?.enabled ?? false}
                    disabled={!isOwner || updateTeamSettings.isLoading}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            if (!settings?.onboardingSettings?.welcomeMessage?.message) {
                                toast("Please set up a welcome message first.");
                                return;
                            }
                        }

                        handleUpdateWelcomeMessage({ enabled: checked });
                    }}
                    label=""
                />
            </InputField>

            <WelcomeMessageEditorModal
                isLoading={updateTeamSettings.isLoading}
                isOwner={isOwner}
                isOpen={welcomeMessageEditorOpen}
                setIsOpen={setWelcomeMessageEditorOpen}
                handleUpdateWelcomeMessage={handleUpdateWelcomeMessage}
                settings={settings?.onboardingSettings?.welcomeMessage}
            />

            <span className="text-pk-content-secondary text-sm">
                Here's a preview of the welcome message that will be shown to your organization members:
            </span>
            <WelcomeMessagePreview
                setWelcomeMessageEditorOpen={setWelcomeMessageEditorOpen}
                disabled={!isOwner || updateTeamSettings.isLoading}
            />
        </ConfigurationSettingsField>
    );
};
