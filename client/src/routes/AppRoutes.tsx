import React from "react";
import { Switch, Route } from "wouter";
import { useAuth } from "../hooks/useAuth";
import type { User as SchemaUser } from "@shared/schema";
const NotFound = React.lazy(() => import("@/pages/not-found").then(m => m.default ? m : { default: Object.values(m)[0] }));
import { CourseDetails } from "@/components/CourseDetails";
import { useLocation } from "wouter";

// Dashboard Components
const StudentDashboard = React.lazy(() => import("@/components/StudentDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherDashboard = React.lazy(() => import("@/components/TeacherDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));
const ParentDashboard = React.lazy(() => import("@/components/ParentDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminDashboard = React.lazy(() => import("@/components/AdminDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));
const FinanceAdminDashboard = React.lazy(() => import("@/components/FinanceAdminDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));
const PartnerAdminDashboard = React.lazy(() => import("@/components/PartnerAdminDashboard").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Student Pages
const StudentMyCourses = React.lazy(() => import("@/pages/student/MyCourses").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentBrowseCourses = React.lazy(() => import("@/pages/student/BrowseCourses").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentAssignments = React.lazy(() => import("@/pages/student/Assignments").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentSchedule = React.lazy(() => import("@/pages/student/Schedule").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentMessages = React.lazy(() => import("@/pages/student/Messages").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentProgress = React.lazy(() => import("@/pages/student/Progress").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Teacher Pages
const TeacherMyCourses = React.lazy(() => import("@/pages/teacher/MyCourses").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherCoursePage = React.lazy(() => import("@/pages/teacher/TeacherCoursePage").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherAssignments = React.lazy(() => import("@/pages/teacher/Assignments").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherStudents = React.lazy(() => import("@/pages/teacher/Students").then(m => m.default ? m : { default: Object.values(m)[0] }));
const StudentDetailPage = React.lazy(() => import("@/pages/teacher/StudentDetailPage").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherMessages = React.lazy(() => import("@/pages/teacher/Messages").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherSchedule = React.lazy(() => import("@/pages/teacher/Schedule").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherAnalytics = React.lazy(() => import("@/pages/teacher/Analytics").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Parent Pages
const ParentChildProgress = React.lazy(() => import("@/pages/parent/ChildProgress").then(m => m.default ? m : { default: Object.values(m)[0] }));
const ParentMessages = React.lazy(() => import("@/pages/parent/Messages").then(m => m.default ? m : { default: Object.values(m)[0] }));
const ParentReports = React.lazy(() => import("@/pages/parent/Reports").then(m => m.default ? m : { default: Object.values(m)[0] }));
const ParentSchedule = React.lazy(() => import("@/pages/parent/Schedule").then(m => m.default ? m : { default: Object.values(m)[0] }));
const ParentPayments = React.lazy(() => import("@/pages/parent/Payments").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Admin Pages
const AdminUserManagement = React.lazy(() => import("@/pages/admin/UserManagement").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminUserDetailPage = React.lazy(() => import("@/pages/admin/UserDetailPage").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminCourseManagement = React.lazy(() => import("@/pages/admin/CourseManagement").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminCoursePage = React.lazy(() => import("@/pages/admin/AdminCoursePage").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminFinancialReports = React.lazy(() => import("@/pages/admin/FinancialReports").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminSystemAnalytics = React.lazy(() => import("@/pages/admin/SystemAnalytics").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminSettings = React.lazy(() => import("@/pages/admin/Settings").then(m => m.default ? m : { default: Object.values(m)[0] }));
const DocumentManagement = React.lazy(() => import("@/pages/admin/DocumentManagement").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminMessages = React.lazy(() => import("@/pages/admin/Messages").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminSchedule = React.lazy(() => import("@/pages/admin/Schedule").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminFeeAssignments = React.lazy(() => import("@/pages/admin/FeeAssignments").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminInvoices = React.lazy(() => import("@/pages/admin/Invoices").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminPayments = React.lazy(() => import("@/pages/admin/Payments").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminPasswordResetRequests = React.lazy(() => import("@/pages/admin/PasswordResetRequests").then(m => m.default ? m : { default: Object.values(m)[0] }));
const AdminProspectStudents = React.lazy(() => import("@/pages/admin/ProspectStudents").then(m => m.default ? m : { default: Object.values(m)[0] }));
const TeacherSessionStats = React.lazy(() => import("@/pages/admin/TeacherSessionStats").then(m => m.default ? m : { default: Object.values(m)[0] }));
const PartnerManagement = React.lazy(() => import("@/pages/admin/PartnerManagement").then(m => m.default ? m : { default: Object.values(m)[0] }));
const PartnerDetails = React.lazy(() => import("@/pages/admin/PartnerDetails").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Finance Admin Pages
const FinanceUsers = React.lazy(() => import("@/pages/finance/Users").then(m => m.default ? m : { default: Object.values(m)[0] }));
const FinanceCourses = React.lazy(() => import("@/pages/finance/Courses").then(m => m.default ? m : { default: Object.values(m)[0] }));
const FinanceMessages = React.lazy(() => import("@/pages/finance/Messages").then(m => m.default ? m : { default: Object.values(m)[0] }));
const FinancePayments = React.lazy(() => import("@/pages/finance/Payments").then(m => m.default ? m : { default: Object.values(m)[0] }));
const FinanceReports = React.lazy(() => import("@/pages/finance/Reports").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Partner Admin Pages
const PartnerAdminUsers = React.lazy(() => import("@/pages/partner_admin/Users").then(m => m.default ? m : { default: Object.values(m)[0] }));
const PartnerAdminProspectStudents = React.lazy(() => import("@/pages/partner_admin/ProspectStudents").then(m => m.default ? m : { default: Object.values(m)[0] }));

// Common Pages
const Profile = React.lazy(() => import("@/pages/Profile").then(m => m.default ? m : { default: Object.values(m)[0] }));

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
