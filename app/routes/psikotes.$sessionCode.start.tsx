import { AlertCircle, BookOpen, CheckCircle, Clock, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/psikotes.$sessionCode.start";
import { useSessions } from "~/hooks/use-sessions";
import { formatDateTime } from "~/lib/utils/date";
import { useAuth } from "~/contexts/auth-context";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Badge } from "~/components/ui/badge";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Psikotes ${params.sessionCode} - Start - Syntegra` },
    { name: "description", content: "Halaman persiapan tes psikologi online" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  // For now, we'll return null since data fetching is handled client-side
  // In the future, this could be used for server-side data fetching
  return null;
}

export default function PsikotesStartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionCode } = useParams();
  const { useGetPublicSessionByCode } = useSessions();
  const {
    data: sessionData,
    isLoading: isValidatingSession,
    error: sessionError,
  } = useGetPublicSessionByCode(sessionCode || "");

  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Memvalidasi sesi...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Memvalidasi sesi...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session not found or error
  if (sessionError || (!isValidatingSession && !sessionData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Sesi Tidak Ditemukan</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sesi psikotes dengan kode <strong>{sessionCode}</strong> tidak
              ditemukan atau sudah berakhir.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">
            Selamat Datang, {user?.name || "Peserta"}!
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {sessionData?.session_name}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-medium mb-2">Informasi Sesi</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateTime(sessionData?.start_time || "")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {sessionData.session_modules?.length || 0} Modul Tes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{sessionData?.target_position || "Umum"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Modules Preview */}
          {sessionData.session_modules &&
            sessionData.session_modules.length > 0 && (
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium mb-3">
                  Modul Tes yang Akan Dikerjakan
                </h3>
                <div className="grid gap-2">
                  {sessionData.session_modules
                    .sort((a: any, b: any) => a.sequence - b.sequence)
                    .map((module: any, index: number) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-2 rounded border"
                      >
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {module.test.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {module.test.time_limit} menit •{" "}
                            {module.test.total_questions} soal
                          </div>
                        </div>
                        {module.test.icon && (
                          <span className="text-lg">{module.test.icon}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/participant/dashboard")}
            >
              Dashboard
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Petunjuk Penting:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pastikan koneksi internet stabil selama mengerjakan tes</li>
              <li>
                • Tes akan tersimpan otomatis setiap jawaban yang Anda berikan
              </li>
              <li>
                • Waktu pengerjaan akan berjalan sesuai durasi yang ditentukan
              </li>
              <li>
                • Jangan menutup browser atau refresh halaman saat mengerjakan
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
