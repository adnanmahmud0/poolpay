"use client";

import React, { useEffect, useState } from "react";

import {
  Bell,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  FlaskConical,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Percent,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Users
} from "lucide-react";
import { toast } from "sonner";

import {
  clearMockData,
  getAppConfig,
  getSettings,
  seedMockData,
  toggleEnvironment as toggleEnvAPI,
  updateAccessAuthSettings,
  updateContactSettings,
  updateContributionSettings,
  updateFinancialSettings,
  updateGeneralSettings,
  updateNotificationSettings,
  updateSettings
} from "@/lib/api-auth";

interface SettingsState {
  platformName: string;
  transactionFeePercent: number;
  lateFeePercent: number;
  gracePeriodDays: number;
  maxRetryCount: number;
  minContribution: number;
  maxContribution: number;
  supportEmail: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  sessionTimeoutMinutes: number;
  isUserRegistrationEnabled: boolean;
  isUserAutoApprovalEnabled: boolean;
  isSocialLoginEnabled: boolean;
  isTwoFactorAuthenticationEnabled: boolean;
  isEmailNotificationEnabled: boolean;
  isPushNotificationEnabled: boolean;
  minimumStripeBalance: number;
}

const defaultSettings: SettingsState = {
  platformName: "PoolPay",
  transactionFeePercent: 5,
  lateFeePercent: 5,
  gracePeriodDays: 3,
  maxRetryCount: 3,
  minContribution: 10,
  maxContribution: 50000,
  supportEmail: "support@poolpay.space",
  supportPhone: "+16079004569",
  supportWhatsapp: "+16079004569",
  sessionTimeoutMinutes: 20,
  isUserRegistrationEnabled: true,
  isUserAutoApprovalEnabled: true,
  isSocialLoginEnabled: true,
  isTwoFactorAuthenticationEnabled: false,
  isEmailNotificationEnabled: true,
  isPushNotificationEnabled: true,
  minimumStripeBalance: 100
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [appEnvironment, setAppEnvironment] = useState<"test" | "production">("test");
  const [isTogglingEnv, setIsTogglingEnv] = useState(false);
  const [showEnvConfirm, setShowEnvConfirm] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSettings();
        if (response.success && response.data) {
          setSettings((prev) => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    getAppConfig()
      .then((res) => {
        if (res?.data?.appEnvironment) setAppEnvironment(res.data.appEnvironment);
      })
      .catch(() => {});
  }, []);

  const handleToggleEnvironment = async (newEnv: "test" | "production") => {
    if (newEnv === appEnvironment) return;
    if (newEnv === "production") {
      setShowEnvConfirm(true);
      return;
    }
    await applyEnvSwitch("test");
  };

  const applyEnvSwitch = async (env: "test" | "production") => {
    setIsTogglingEnv(true);
    try {
      await toggleEnvAPI(env);
      setAppEnvironment(env);
      setShowEnvConfirm(false);
      toast.success(`Switched to ${env === "test" ? "TEST (Sandbox)" : "PRODUCTION (Live)"} mode`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to switch environment");
    } finally {
      setIsTogglingEnv(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await updateSettings(settings);
      if (response.success) {
        toast.success("All settings updated successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSavingSection("general");
    try {
      const response = await updateGeneralSettings({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail
      });
      if (response.success) {
        toast.success("General settings saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save general settings");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveFinancial = async () => {
    setSavingSection("financial");
    try {
      const response = await updateFinancialSettings({
        transactionFeePercent: Number(settings.transactionFeePercent),
        lateFeePercent: Number(settings.lateFeePercent),
        gracePeriodDays: Number(settings.gracePeriodDays),
        maxRetryCount: Number(settings.maxRetryCount),
        minimumStripeBalance: Number(settings.minimumStripeBalance)
      });
      if (response.success) {
        toast.success("Financial & fee settings saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save financial settings");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveContributions = async () => {
    setSavingSection("contributions");
    try {
      const response = await updateContributionSettings({
        minContribution: Number(settings.minContribution),
        maxContribution: Number(settings.maxContribution)
      });
      if (response.success) {
        toast.success("Contribution limits saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save contribution limits");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAccessAuth = async () => {
    setSavingSection("access-auth");
    try {
      const response = await updateAccessAuthSettings({
        sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes),
        isUserRegistrationEnabled: Boolean(settings.isUserRegistrationEnabled),
        isUserAutoApprovalEnabled: Boolean(settings.isUserAutoApprovalEnabled),
        isTwoFactorAuthenticationEnabled: Boolean(settings.isTwoFactorAuthenticationEnabled)
      });
      if (response.success) {
        toast.success("Access & authentication settings saved successfully");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save access & authentication settings"
      );
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingSection("notifications");
    try {
      const response = await updateNotificationSettings({
        isEmailNotificationEnabled: Boolean(settings.isEmailNotificationEnabled),
        isPushNotificationEnabled: Boolean(settings.isPushNotificationEnabled)
      });
      if (response.success) {
        toast.success("Notification settings saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save notification settings");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveContact = async () => {
    setSavingSection("contact");
    try {
      const response = await updateContactSettings({
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        supportWhatsapp: settings.supportWhatsapp
      });
      if (response.success) {
        toast.success("Contact channels saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save contact channels");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSeedData = async () => {
    if (!confirm("Are you sure? This will add mock data to your database.")) return;
    setIsSaving(true);
    try {
      const response = await seedMockData();
      if (response.success) {
        toast.success("Mock data seeded successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to seed mock data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("CRITICAL: This will delete all mock data. Proceed?")) return;
    setIsSaving(true);
    try {
      const response = await clearMockData();
      if (response.success) {
        toast.success("Mock data cleared successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clear mock data");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof SettingsState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A2279]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 pb-12 sm:space-y-6">
      {/* ── Environment Mode Card ── */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5">
          <FlaskConical className="h-5 w-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Environment Mode</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              appEnvironment === "test"
                ? "border border-amber-300 bg-amber-100 text-amber-700"
                : "border border-emerald-300 bg-emerald-100 text-emerald-700"
            }`}
          >
            {appEnvironment === "test" ? "⚠️ SANDBOX" : "🟢 LIVE"}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* TEST card */}
            <button
              onClick={() => handleToggleEnvironment("test")}
              disabled={isTogglingEnv}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                appEnvironment === "test"
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span
                  className={`font-semibold ${appEnvironment === "test" ? "text-amber-700" : "text-gray-700"}`}
                >
                  TEST MODE
                </span>
                {appEnvironment === "test" && (
                  <span className="ml-auto text-xs font-bold text-amber-600">● ACTIVE</span>
                )}
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Stripe Sandbox (pk_test_...)</li>
                <li>✓ No real money processed</li>
                <li>✓ Test cards accepted</li>
              </ul>
            </button>

            {/* PRODUCTION card */}
            <button
              onClick={() => handleToggleEnvironment("production")}
              disabled={isTogglingEnv}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                appEnvironment === "production"
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">🟢</span>
                <span
                  className={`font-semibold ${appEnvironment === "production" ? "text-emerald-700" : "text-gray-700"}`}
                >
                  PRODUCTION
                </span>
                {appEnvironment === "production" && (
                  <span className="ml-auto text-xs font-bold text-emerald-600">● ACTIVE</span>
                )}
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Stripe Live (pk_live_...)</li>
                <li>✓ Real payments processed</li>
                <li>✓ Real customer cards</li>
              </ul>
            </button>
          </div>

          {isTogglingEnv && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Switching environment...
            </div>
          )}
        </div>
      </div>

      {/* ── Production Confirmation Modal ── */}
      {showEnvConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="animate-in fade-in zoom-in w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl duration-200 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <CheckCircle2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Switch to PRODUCTION?</h3>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              You are about to switch to <strong>PRODUCTION mode</strong>.
            </p>
            <ul className="mb-6 space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <li>⚠️ Real money will be charged to customers</li>
              <li>⚠️ Stripe Live keys will be active</li>
              <li>⚠️ All payments will be processed immediately</li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowEnvConfirm(false)}
                className="order-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:order-1 sm:flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => applyEnvSwitch("production")}
                disabled={isTogglingEnv}
                className="order-1 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 sm:order-2 sm:flex-1"
              >
                {isTogglingEnv ? "Switching..." : "Yes, Switch to LIVE"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsSection
        title="General Settings"
        icon={<Settings className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveGeneral}
        isSaving={savingSection === "general"}
        saveLabel="Save General"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputGroup
            label="Platform Name"
            value={settings?.platformName || ""}
            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
          />
          <InputGroup
            label="Support Email"
            value={settings?.supportEmail || ""}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
        </div>
      </SettingsSection>

      {/* Financial Settings */}
      <SettingsSection
        title="Financial & Fee Settings"
        icon={<Percent className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveFinancial}
        isSaving={savingSection === "financial"}
        saveLabel="Save Financial"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputGroup
            label="Transaction Fee (%)"
            type="number"
            value={(settings?.transactionFeePercent ?? 0).toString()}
            onChange={(e) =>
              setSettings({ ...settings, transactionFeePercent: Number(e.target.value) })
            }
          />
          <InputGroup
            label="Late Fee (%)"
            type="number"
            value={(settings?.lateFeePercent ?? 0).toString()}
            onChange={(e) => setSettings({ ...settings, lateFeePercent: Number(e.target.value) })}
          />
          <InputGroup
            label="Grace Period (Days)"
            type="number"
            icon={<Clock className="h-4 w-4 text-gray-400" />}
            value={(settings?.gracePeriodDays ?? 0).toString()}
            onChange={(e) => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })}
          />
          <InputGroup
            label="Max Retry Count"
            type="number"
            icon={<RotateCcw className="h-4 w-4 text-gray-400" />}
            value={(settings?.maxRetryCount ?? 0).toString()}
            onChange={(e) => setSettings({ ...settings, maxRetryCount: Number(e.target.value) })}
          />
          <InputGroup
            label="Min. Stripe Balance ($)"
            type="number"
            icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            value={(settings?.minimumStripeBalance ?? 0).toString()}
            onChange={(e) =>
              setSettings({ ...settings, minimumStripeBalance: Number(e.target.value) })
            }
          />
        </div>
      </SettingsSection>

      {/* Contribution Settings */}
      <SettingsSection
        title="Contribution Limits"
        icon={<DollarSign className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveContributions}
        isSaving={savingSection === "contributions"}
        saveLabel="Save Limits"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputGroup
            label="Minimum Contribution ($)"
            type="number"
            value={(settings?.minContribution ?? 0).toString()}
            onChange={(e) => setSettings({ ...settings, minContribution: Number(e.target.value) })}
          />
          <InputGroup
            label="Maximum Contribution ($)"
            type="number"
            value={(settings?.maxContribution ?? 0).toString()}
            onChange={(e) => setSettings({ ...settings, maxContribution: Number(e.target.value) })}
          />
        </div>
      </SettingsSection>

      {/* User & Auth Settings */}
      <SettingsSection
        title="Access & Authentication"
        icon={<Users className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveAccessAuth}
        isSaving={savingSection === "access-auth"}
        saveLabel="Save Access & Auth"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <InputGroup
              label="App Inactivity Auto-Logout (Minutes)"
              type="number"
              value={(settings?.sessionTimeoutMinutes ?? 20).toString()}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionTimeoutMinutes: Math.max(1, Number(e.target.value))
                })
              }
            />
            <p className="mt-2 text-xs text-gray-500">
              Mobile app users will be automatically logged out after this duration of inactivity.
              Access tokens will also expire in this timeframe.
            </p>
          </div>
          <ToggleGroup
            title="Enable User Registration"
            description="Allow new users to sign up on the platform"
            enabled={Boolean(settings?.isUserRegistrationEnabled)}
            onToggle={() => toggleSetting("isUserRegistrationEnabled")}
          />
          <ToggleGroup
            title="Auto-Approve New Users"
            description="Automatically approve new user registrations (if disabled, new users require admin approval before they can log in)"
            enabled={Boolean(settings?.isUserAutoApprovalEnabled)}
            onToggle={() => toggleSetting("isUserAutoApprovalEnabled")}
          />
          <ToggleGroup
            title="Two-Factor Authentication"
            description="Enable 2FA security for user accounts"
            enabled={Boolean(settings?.isTwoFactorAuthenticationEnabled)}
            onToggle={() => toggleSetting("isTwoFactorAuthenticationEnabled")}
          />
        </div>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection
        title="Notification System"
        icon={<Bell className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveNotifications}
        isSaving={savingSection === "notifications"}
        saveLabel="Save Notifications"
      >
        <div className="space-y-6">
          <ToggleGroup
            title="Email Notifications"
            description="Global toggle for automated email alerts"
            enabled={Boolean(settings?.isEmailNotificationEnabled)}
            onToggle={() => toggleSetting("isEmailNotificationEnabled")}
          />
          <ToggleGroup
            title="Push Notifications"
            description="Global toggle for push notifications to mobile devices"
            enabled={Boolean(settings?.isPushNotificationEnabled)}
            onToggle={() => toggleSetting("isPushNotificationEnabled")}
          />
        </div>
      </SettingsSection>

      {/* Contact & Support Settings */}
      <SettingsSection
        title="Contact & Support Channels"
        icon={<HelpCircle className="h-5 w-5 text-gray-500" />}
        onSave={handleSaveContact}
        isSaving={savingSection === "contact"}
        saveLabel="Save Contact Channels"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <InputGroup
            label="Support Email"
            type="email"
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            value={settings?.supportEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
          <InputGroup
            label="Support Phone Number"
            type="text"
            icon={<Phone className="h-4 w-4 text-gray-400" />}
            value={settings?.supportPhone ?? ""}
            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
          />
          <InputGroup
            label="WhatsApp Business (Number or Link)"
            type="text"
            icon={<MessageSquare className="h-4 w-4 text-gray-400" />}
            value={settings?.supportWhatsapp ?? ""}
            onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })}
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          These contact channels are displayed to users in the mobile app. Tapping them will
          automatically trigger email, phone call, or WhatsApp conversation.
        </p>
      </SettingsSection>

      {/* Developer Tools */}
      <SettingsSection title="Developer Tools" icon={<Database className="h-5 w-5 text-red-500" />}>
        <div className="flex flex-col gap-4 md:flex-row">
          <button
            onClick={handleSeedData}
            disabled={isSaving}
            className="group flex flex-1 items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 transition-all hover:bg-indigo-50"
          >
            <div className="text-left">
              <h4 className="text-sm font-bold text-indigo-900">Seed Mock Data</h4>
              <p className="text-xs text-indigo-400">
                Populate database with test visualization data
              </p>
            </div>
            <RefreshCw className="h-5 w-5 text-indigo-600 transition-transform duration-500 group-hover:rotate-180" />
          </button>

          <button
            onClick={handleClearData}
            disabled={isSaving}
            className="group flex flex-1 items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-6 transition-all hover:bg-red-50"
          >
            <div className="text-left">
              <h4 className="text-sm font-bold text-red-900">Clear Mock Data</h4>
              <p className="text-xs text-red-400">Remove all generated test data from system</p>
            </div>
            <Trash2 className="h-5 w-5 text-red-600 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </SettingsSection>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end sm:mt-8">
        <button
          onClick={handleSaveAll}
          disabled={isSaving || savingSection !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A2279] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving All..." : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  children,
  onSave,
  isSaving,
  saveLabel = "Save Changes"
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
        </div>
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#1A2279] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Saving..." : saveLabel}
          </button>
        )}
      </div>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      {onSave && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-3.5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500 sm:text-left">
            Save updates to <span className="font-semibold text-gray-700">{title}</span>{" "}
            independently.
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A2279] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Saving..." : saveLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  type = "text",
  icon
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="relative">
        {icon && <div className="absolute top-1/2 left-4 -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all focus:border-[#1A2279] focus:ring-2 focus:ring-[#1A2279]/5 focus:outline-none ${icon ? "pl-11" : ""}`}
        />
      </div>
    </div>
  );
}

function ToggleGroup({
  title,
  description,
  enabled,
  onToggle
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="group flex items-center justify-between">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-12 rounded-full transition-all ${
          enabled ? "bg-[#1A2279]" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
            enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
