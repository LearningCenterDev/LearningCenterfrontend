import React from "react";
import { Switch, Route } from "wouter";
import { useAuth } from "../hooks/useAuth";
import type { User as SchemaUser } from "@shared/schema";
import NotFound from "@/pages/not-found";
import { CourseDetails } from "@/components/CourseDetails";
import { useLocation } from "wouter";

// Dashboard Components
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import ParentDashboard from "@/components/ParentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import FinanceAdminDashboard from "@/components/FinanceAdminDashboard";
import PartnerAdminDashboard from "@/components/PartnerAdminDashboard";

// Student Pages
import StudentMyCourses from "@/pages/student/MyCourses";
import StudentBrowseCourses from "@/pages/student/BrowseCourses";
import StudentAssignments from "@/pages/student/Assignments";
import StudentSchedule from "@/pages/student/Schedule";
import StudentMessages from "@/pages/student/Messages";
import StudentProgress from "@/pages/student/Progress";

// Teacher Pages
import TeacherMyCourses from "@/pages/teacher/MyCourses";
import TeacherCoursePage from "@/pages/teacher/TeacherCoursePage";
import TeacherAssignments from "@/pages/teacher/Assignments";
import TeacherStudents from "@/pages/teacher/Students";
import StudentDetailPage from "@/pages/teacher/StudentDetailPage";
import TeacherMessages from "@/pages/teacher/Messages";
import TeacherSchedule from "@/pages/teacher/Schedule";
import TeacherAnalytics from "@/pages/teacher/Analytics";

// Parent Pages
import ParentChildProgress from "@/pages/parent/ChildProgress";
import ParentMessages from "@/pages/parent/Messages";
import ParentReports from "@/pages/parent/Reports";
import ParentSchedule from "@/pages/parent/Schedule";
import ParentPayments from "@/pages/parent/Payments";

// Admin Pages
import AdminUserManagement from "@/pages/admin/UserManagement";
import AdminUserDetailPage from "@/pages/admin/UserDetailPage";
import AdminCourseManagement from "@/pages/admin/CourseManagement";
import AdminCoursePage from "@/pages/admin/AdminCoursePage";
import AdminFinancialReports from "@/pages/admin/FinancialReports";
import AdminSystemAnalytics from "@/pages/admin/SystemAnalytics";
import AdminSettings from "@/pages/admin/Settings";
import DocumentManagement from "@/pages/admin/DocumentManagement";
import AdminMessages from "@/pages/admin/Messages";
import AdminSchedule from "@/pages/admin/Schedule";
import AdminFeeAssignments from "@/pages/admin/FeeAssignments";
import AdminInvoices from "@/pages/admin/Invoices";
import AdminPayments from "@/pages/admin/Payments";
import AdminPasswordResetRequests from "@/pages/admin/PasswordResetRequests";
import AdminProspectStudents from "@/pages/admin/ProspectStudents";
import TeacherSessionStats from "@/pages/admin/TeacherSessionStats";
import PartnerManagement from "@/pages/admin/PartnerManagement";
import PartnerDetails from "@/pages/admin/PartnerDetails";

// Finance Admin Pages
import FinanceUsers from "@/pages/finance/Users";
import FinanceCourses from "@/pages/finance/Courses";
import FinanceMessages from "@/pages/finance/Messages";
import FinancePayments from "@/pages/finance/Payments";
import FinanceReports from "@/pages/finance/Reports";

// Partner Admin Pages
import PartnerAdminUsers from "@/pages/partner_admin/Users";
import PartnerAdminProspectStudents from "@/pages/partner_admin/ProspectStudents";

// Common Pages
import Profile from "@/pages/Profile";

function CourseDetailWithBackButton({ courseId, currentUser }: { courseId: string; currentUser: SchemaUser }) {
    const [, navigate] = useLocation();
    return <CourseDetails courseId={courseId} currentUser={currentUser} onNavigateBack={() => navigate("/courses")} />;
}

export default function AppRoutes() {
    const { user } = useAuth();

    if (!user) return null;

    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

    return (
        <Switch>
            {/* Dashboard Routes */}
            <Route path="/" component={() => {
                switch (user.role) {
                    case "student": return <StudentDashboard studentId={user.id} studentName={displayName} />;
                    case "teacher": return <TeacherDashboard teacherId={user.id} teacherName={displayName} />;
                    case "parent": return <ParentDashboard parentId={user.id} parentName={displayName} />;
                    case "admin": return <AdminDashboard adminId={user.id} adminName={displayName} />;
                    case "finance_admin": return <FinanceAdminDashboard financeAdminId={user.id} financeAdminName={displayName} />;
                    case "partner_admin": return <PartnerAdminDashboard partnerAdminId={user.id} partnerAdminName={displayName} />;
                    default: return <NotFound />;
                }
            }} />

            <Route path="/dashboard" component={() => {
                switch (user.role) {
                    case "student": return <StudentDashboard studentId={user.id} studentName={displayName} />;
                    case "teacher": return <TeacherDashboard teacherId={user.id} teacherName={displayName} />;
                    case "parent": return <ParentDashboard parentId={user.id} parentName={displayName} />;
                    case "admin": return <AdminDashboard adminId={user.id} adminName={displayName} />;
                    case "finance_admin": return <FinanceAdminDashboard financeAdminId={user.id} financeAdminName={displayName} />;
                    case "partner_admin": return <PartnerAdminDashboard partnerAdminId={user.id} partnerAdminName={displayName} />;
                    default: return <NotFound />;
                }
            }} />

            {/* Courses Routes */}
            <Route path="/courses" component={() => {
                switch (user.role) {
                    case "student": return <StudentMyCourses studentId={user.id} />;
                    case "teacher": return <TeacherMyCourses teacherId={user.id} />;
                    case "admin": return <AdminCourseManagement adminId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            <Route path="/courses/:courseId" component={({ params }: { params: { courseId: string } }) => {
                if (user.role === "teacher") return <TeacherCoursePage courseId={params.courseId} teacherId={user.id} />;
                if (user.role === "admin") return <AdminCoursePage courseId={params.courseId} adminId={user.id} />;
                return <CourseDetailWithBackButton courseId={params.courseId} currentUser={user as any} />;
            }} />

            <Route path="/browse-courses" component={() => <StudentBrowseCourses studentId={user.id} />} />

            {/* Assignments Routes */}
            <Route path="/assignments" component={() => {
                switch (user.role) {
                    case "student": return <StudentAssignments studentId={user.id} />;
                    case "teacher": return <TeacherAssignments teacherId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            {/* Schedule Routes */}
            <Route path="/schedule" component={() => {
                switch (user.role) {
                    case "student": return <StudentSchedule studentId={user.id} />;
                    case "teacher": return <TeacherSchedule teacherId={user.id} />;
                    case "parent": return <ParentSchedule parentId={user.id} />;
                    case "admin": return <AdminSchedule adminId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            {/* Messages Routes */}
            <Route path="/messages" component={() => {
                switch (user.role) {
                    case "student": return <StudentMessages studentId={user.id} />;
                    case "teacher": return <TeacherMessages teacherId={user.id} />;
                    case "parent": return <ParentMessages parentId={user.id} />;
                    case "admin": return <AdminMessages adminId={user.id} />;
                    case "finance_admin": return <FinanceMessages financeAdminId={user.id} />;
                    case "partner_admin": return <AdminMessages adminId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            {/* Progress Routes */}
            <Route path="/progress" component={() => {
                switch (user.role) {
                    case "student": return <StudentProgress studentId={user.id} />;
                    case "parent": return <ParentChildProgress parentId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            {/* Analytics Routes */}
            <Route path="/analytics" component={() => {
                switch (user.role) {
                    case "teacher": return <TeacherAnalytics teacherId={user.id} />;
                    case "admin": return <AdminSystemAnalytics adminId={user.id} />;
                    default: return <NotFound />;
                }
            }} />

            {/* User Management & Profile */}
            <Route path="/profile" component={Profile} />
            <Route path="/users" component={() => {
                if (user.role === "admin") return <AdminUserManagement adminId={user.id} />;
                if (user.role === "partner_admin") return <PartnerAdminUsers />;
                return <NotFound />;
            }} />
            <Route path="/users/:userId" component={() => user.role === "admin" ? <AdminUserDetailPage /> : <NotFound />} />

            {/* Partner Admin Routes */}
            <Route path="/partners" component={() => user.role === "admin" ? <PartnerManagement /> : <NotFound />} />
            <Route path="/partners/:partnerId" component={({ params }: { params: { partnerId: string } }) => user.role === "admin" ? <PartnerDetails partnerId={params.partnerId} /> : <NotFound />} />

            {/* Financial Routes */}
            <Route path="/finances" component={() => (user.role === "admin" || user.role === "finance_admin") ? <AdminFinancialReports adminId={user.id} /> : <NotFound />} />
            <Route path="/fee-assignments" component={() => (user.role === "admin" || user.role === "finance_admin") ? <AdminFeeAssignments /> : <NotFound />} />
            <Route path="/invoices" component={() => (user.role === "admin" || user.role === "finance_admin") ? <AdminInvoices /> : <NotFound />} />
            <Route path="/admin-payments" component={() => (user.role === "admin" || user.role === "finance_admin") ? <AdminPayments /> : <NotFound />} />

            {/* Admin Specific */}
            <Route path="/documents" component={() => user.role === "admin" ? <DocumentManagement adminId={user.id} /> : <NotFound />} />
            <Route path="/settings" component={() => user.role === "admin" ? <AdminSettings adminId={user.id} /> : <NotFound />} />
            <Route path="/password-reset-requests" component={() => user.role === "admin" ? <AdminPasswordResetRequests /> : <NotFound />} />

            {/* Partner/Finance Specific */}
            <Route path="/prospect-students" component={() => {
                if (user.role === "admin" || user.role === "finance_admin") return <AdminProspectStudents adminId={user.id} />;
                if (user.role === "partner_admin") return <PartnerAdminProspectStudents />;
                return <NotFound />;
            }} />

            <Route path="/teacher-session-stats" component={() => (user.role === "admin" || user.role === "finance_admin") ? <TeacherSessionStats userId={user.id} /> : <NotFound />} />

            {/* Finance Admin-specific Routes */}
            <Route path="/finance/users" component={() => user.role === "finance_admin" ? <FinanceUsers financeAdminId={user.id} /> : <NotFound />} />
            <Route path="/finance/courses" component={() => user.role === "finance_admin" ? <FinanceCourses financeAdminId={user.id} /> : <NotFound />} />
            <Route path="/finances/reports" component={() => user.role === "finance_admin" ? <FinanceReports /> : <NotFound />} />

            {/* Teacher Specific */}
            <Route path="/students" component={() => user.role === "teacher" ? <TeacherStudents teacherId={user.id} /> : <NotFound />} />
            <Route path="/students/:studentId" component={() => user.role === "teacher" ? <StudentDetailPage /> : <NotFound />} />

            {/* Parent Specific */}
            <Route path="/reports" component={() => user.role === "parent" ? <ParentReports parentId={user.id} /> : <NotFound />} />
            <Route path="/payments" component={() => user.role === "parent" ? <ParentPayments parentId={user.id} /> : <NotFound />} />

            {/* Fallback */}
            <Route component={NotFound} />
        </Switch>
    );
}
