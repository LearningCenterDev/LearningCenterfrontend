import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, TrendingUp, Award, BarChart3, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface ParentReportsProps {
  parentId: string;
}

interface ReportData {
  id: string;
  type: 'progress' | 'attendance' | 'grades' | 'behavioral';
  title: string;
  description: string;
  childName: string;
  childId: string;
  generatedDate: Date;
  period: string;
  isAvailable: boolean;
}

export default function ParentReports({ parentId }: ParentReportsProps) {
  const { data: reports = [], isLoading } = useQuery<ReportData[]>({
    queryKey: ["/api/parent/reports", parentId],
  });

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'default';
      case 'attendance': return 'secondary';
      case 'grades': return 'outline';
      case 'behavioral': return 'destructive';
      default: return 'default';
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'progress': return TrendingUp;
      case 'attendance': return Calendar;
      case 'grades': return Award;
      case 'behavioral': return BarChart3;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const groupedReports = reports.reduce((acc, report) => {
    if (!acc[report.childName]) {
      acc[report.childName] = [];
    }
    acc[report.childName].push(report);
    return acc;
  }, {} as Record<string, ReportData[]>);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="parent-reports-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Academic and progress reports for your children
            </p>
          </div>
          <Badge variant="secondary" data-testid="reports-count">
            {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
          </Badge>
        </div>
        <Button variant="outline" data-testid="button-request-report">
          <FileText className="w-4 h-4 mr-2" />
          Request Report
        </Button>
      </div>

      {/* Report Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Reports</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-total-reports">{reports.length}</div>
          </CardContent>
        </Card>
        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-progress-reports">
              {reports.filter(r => r.type === 'progress').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Attendance</span>
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary" data-testid="stat-attendance-reports">
              {reports.filter(r => r.type === 'attendance').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Grades</span>
              <div className="p-2 rounded-lg bg-secondary/10">
                <Award className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-secondary" data-testid="stat-grade-reports">
              {reports.filter(r => r.type === 'grades').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No reports available</h3>
              <p className="text-muted-foreground mb-6">
                Reports will be generated periodically and made available here. You can also request specific reports.
              </p>
              <Button data-testid="button-request-first-report">
                Request Your First Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReports).map(([childName, childReports]) => (
            <Card key={childName} data-testid={`child-reports-${childName}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <span>{childName} - Reports</span>
                  <Badge variant="outline" className="text-xs">
                    {childReports.length} reports
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {childReports.map((report) => {
                    const IconComponent = getReportIcon(report.type);
                    return (
                      <div 
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/40"
                        data-testid={`report-${report.id}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-primary/5 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-base">{report.title}</h4>
                              <Badge variant={getReportTypeColor(report.type)} className="text-xs">
                                {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                              </Badge>
                              {!report.isAvailable && (
                                <Badge variant="secondary" className="text-xs">
                                  Processing
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span>Period: {report.period}</span>
                              <span>Generated: {format(new Date(report.generatedDate), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {report.isAvailable ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-view-report-${report.id}`}
                              >
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                data-testid={`button-download-report-${report.id}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled
                              data-testid={`button-processing-report-${report.id}`}
                            >
                              Processing...
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Report Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Progress Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive academic progress including grades, assignment completion, and teacher feedback.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Attendance Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Detailed attendance records including absences, tardiness, and attendance patterns.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Grade Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Individual subject grades, GPA calculations, and performance comparisons.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Behavioral Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Classroom behavior, social interactions, and disciplinary records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
