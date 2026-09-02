"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Percent, 
  Clock, 
  RotateCcw, 
  DollarSign, 
  Users, 
  Bell, 
  Save, 
  Loader2, 
  Database, 
  Trash2, 
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { 
  getSettings, 
  updateSettings, 
  updateGeneralSettings,
  updateFinancialSettings,
  updateContributionSettings,
  updateAccessAuthSettings,
  updateNotificationSettings,
  updateContactSettings,
  seedMockData, 
  clearMockData 
} from "@/lib/api-auth";
import { toast } from "sonner";

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
  isSocialLoginEnabled: true,
  isTwoFactorAuthenticationEnabled: false,
  isEmailNotificationEnabled: true,
  isPushNotificationEnabled: true,
  minimumStripeBalance: 100,
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSettings();
        if (response.success && response.data) {
          setSettings((prev) => ({
            ...prev,
            ...response.data,
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
        supportEmail: settings.supportEmail,
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
        minimumStripeBalance: Number(settings.minimumStripeBalance),
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
        maxContribution: Number(settings.maxContribution),
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
        isTwoFactorAuthenticationEnabled: Boolean(settings.isTwoFactorAuthenticationEnabled),
      });
      if (response.success) {
        toast.success("Access & authentication settings saved successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save access & authentication settings");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingSection("notifications");
    try {
      const response = await updateNotificationSettings({
        isEmailNotificationEnabled: Boolean(settings.isEmailNotificationEnabled),
        isPushNotificationEnabled: Boolean(settings.isPushNotificationEnabled),
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
        supportWhatsapp: settings.supportWhatsapp,
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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A2279] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* General Settings */}
      <SettingsSection 
        title="General Settings" 
        icon={<Settings className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveGeneral}
        isSaving={savingSection === "general"}
        saveLabel="Save General"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        icon={<Percent className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveFinancial}
        isSaving={savingSection === "financial"}
        saveLabel="Save Financial"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup 
            label="Transaction Fee (%)" 
            type="number"
            value={(settings?.transactionFeePercent ?? 0).toString()} 
            onChange={(e) => setSettings({ ...settings, transactionFeePercent: Number(e.target.value) })} 
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
            icon={<Clock className="w-4 h-4 text-gray-400" />}
            value={(settings?.gracePeriodDays ?? 0).toString()} 
            onChange={(e) => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })} 
          />
          <InputGroup 
            label="Max Retry Count" 
            type="number"
            icon={<RotateCcw className="w-4 h-4 text-gray-400" />}
            value={(settings?.maxRetryCount ?? 0).toString()} 
            onChange={(e) => setSettings({ ...settings, maxRetryCount: Number(e.target.value) })} 
          />
          <InputGroup 
            label="Min. Stripe Balance ($)" 
            type="number"
            icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            value={(settings?.minimumStripeBalance ?? 0).toString()} 
            onChange={(e) => setSettings({ ...settings, minimumStripeBalance: Number(e.target.value) })} 
          />
        </div>
      </SettingsSection>

      {/* Contribution Settings */}
      <SettingsSection 
        title="Contribution Limits" 
        icon={<DollarSign className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveContributions}
        isSaving={savingSection === "contributions"}
        saveLabel="Save Limits"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        icon={<Users className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveAccessAuth}
        isSaving={savingSection === "access-auth"}
        saveLabel="Save Access & Auth"
      >
        <div className="space-y-6">
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
            <InputGroup 
              label="App Inactivity Auto-Logout (Minutes)" 
              type="number"
              value={(settings?.sessionTimeoutMinutes ?? 20).toString()} 
              onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Math.max(1, Number(e.target.value)) })} 
            />
            <p className="text-xs text-gray-500 mt-2">
              Mobile app users will be automatically logged out after this duration of inactivity. Access tokens will also expire in this timeframe.
            </p>
          </div>
          <ToggleGroup 
            title="Enable User Registration" 
            description="Allow new users to sign up on the platform" 
            enabled={Boolean(settings?.isUserRegistrationEnabled)} 
            onToggle={() => toggleSetting('isUserRegistrationEnabled')} 
          />
          <ToggleGroup 
            title="Two-Factor Authentication" 
            description="Enable 2FA security for user accounts" 
            enabled={Boolean(settings?.isTwoFactorAuthenticationEnabled)} 
            onToggle={() => toggleSetting('isTwoFactorAuthenticationEnabled')} 
          />
        </div>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection 
        title="Notification System" 
        icon={<Bell className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveNotifications}
        isSaving={savingSection === "notifications"}
        saveLabel="Save Notifications"
      >
        <div className="space-y-6">
          <ToggleGroup 
            title="Email Notifications" 
            description="Global toggle for automated email alerts" 
            enabled={Boolean(settings?.isEmailNotificationEnabled)} 
            onToggle={() => toggleSetting('isEmailNotificationEnabled')} 
          />
          <ToggleGroup 
            title="Push Notifications" 
            description="Global toggle for push notifications to mobile devices" 
            enabled={Boolean(settings?.isPushNotificationEnabled)} 
            onToggle={() => toggleSetting('isPushNotificationEnabled')} 
          />
        </div>
      </SettingsSection>

      {/* Contact & Support Settings */}
      <SettingsSection 
        title="Contact & Support Channels" 
        icon={<HelpCircle className="w-5 h-5 text-gray-500" />}
        onSave={handleSaveContact}
        isSaving={savingSection === "contact"}
        saveLabel="Save Contact Channels"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputGroup 
            label="Support Email" 
            type="email"
            icon={<Mail className="w-4 h-4 text-gray-400" />}
            value={settings?.supportEmail ?? ""} 
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} 
          />
          <InputGroup 
            label="Support Phone Number" 
            type="text"
            icon={<Phone className="w-4 h-4 text-gray-400" />}
            value={settings?.supportPhone ?? ""} 
            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} 
          />
          <InputGroup 
            label="WhatsApp Business (Number or Link)" 
            type="text"
            icon={<MessageSquare className="w-4 h-4 text-gray-400" />}
            value={settings?.supportWhatsapp ?? ""} 
            onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })} 
          />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          These contact channels are displayed to users in the mobile app. Tapping them will automatically trigger email, phone call, or WhatsApp conversation.
        </p>
      </SettingsSection>

      {/* Developer Tools */}
      <SettingsSection 
        title="Developer Tools" 
        icon={<Database className="w-5 h-5 text-red-500" />}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={handleSeedData}
            disabled={isSaving}
            className="flex-1 flex items-center justify-between p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl group hover:bg-indigo-50 transition-all"
          >
            <div className="text-left">
              <h4 className="text-sm font-bold text-indigo-900">Seed Mock Data</h4>
              <p className="text-xs text-indigo-400">Populate database with test visualization data</p>
            </div>
            <RefreshCw className="w-5 h-5 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          
          <button 
            onClick={handleClearData}
            disabled={isSaving}
            className="flex-1 flex items-center justify-between p-6 bg-red-50/50 border border-red-100 rounded-2xl group hover:bg-red-50 transition-all"
          >
            <div className="text-left">
              <h4 className="text-sm font-bold text-red-900">Clear Mock Data</h4>
              <p className="text-xs text-red-400">Remove all generated test data from system</p>
            </div>
            <Trash2 className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </SettingsSection>

      {/* Action Buttons */}
      <div className="flex justify-end mt-8">
        <button 
          onClick={handleSaveAll}
          disabled={isSaving || savingSection !== null}
          className="bg-[#1A2279] text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
    <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {onSave && (
          <button 
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="bg-[#1A2279] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-900 transition-all shadow-sm shadow-indigo-100 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? "Saving..." : saveLabel}
          </button>
        )}
      </div>
      <div className="p-8">
        {children}
      </div>
      {onSave && (
        <div className="px-8 py-3.5 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Save updates to <span className="font-semibold text-gray-700">{title}</span> independently.
          </p>
          <button 
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-[#1A2279] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-900 transition-all shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? "Saving..." : saveLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", icon }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input 
          type={type} 
          value={value} 
          onChange={onChange}
          className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1A2279]/5 focus:border-[#1A2279] transition-all ${icon ? 'pl-11' : ''}`}
        />
      </div>
    </div>
  );
}

function ToggleGroup({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative ${
          enabled ? "bg-[#1A2279]" : "bg-gray-200"
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
          enabled ? "left-7" : "left-1"
        }`} />
      </button>
    </div>
  );
}
