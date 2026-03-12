import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Edit, User, Lock, Globe } from "lucide-react";
import { motion } from "framer-motion";

// Modular Components
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";
import PreferencesForm from "@/components/profile/PreferencesForm";
import MyDocumentsCard from "@/components/profile/MyDocumentsCard";
import StudentHistoryCard from "@/components/StudentHistoryCard";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.profileImageUrl || "");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(user?.coverPhotoUrl || "");
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">

        <ProfileHeader
          user={user}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          coverPhotoUrl={coverPhotoUrl}
          setCoverPhotoUrl={setCoverPhotoUrl}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        <MyDocumentsCard userId={user.id} />

        {user.role === 'student' && (
          <StudentHistoryCard studentId={user.id} />
        )}

        {/* Profile Settings Collapsible */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-0 shadow-2xl overflow-hidden mt-6">
                <CardHeader className="bg-gradient-to-r from-[#1F3A5F] to-[#2a4a75] text-white">
                  <CardTitle className="flex items-center gap-3">
                    <Edit className="w-5 h-5" /> Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                      <TabsTrigger value="profile" className="flex items-center gap-2"><User className="w-4 h-4" /> Info</TabsTrigger>
                      <TabsTrigger value="security" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Security</TabsTrigger>
                      <TabsTrigger value="preferences" className="flex items-center gap-2"><Globe className="w-4 h-4" /> Prefs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                      <ProfileForm user={user} onSuccess={() => setShowSettings(false)} />
                    </TabsContent>
                    <TabsContent value="security">
                      <PasswordForm userId={user.id} onSuccess={() => setShowSettings(false)} />
                    </TabsContent>
                    <TabsContent value="preferences">
                      <PreferencesForm user={user} onSuccess={() => setShowSettings(false)} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}