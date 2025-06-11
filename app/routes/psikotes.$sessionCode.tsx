import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import type { Route } from "./+types/psikotes.$sessionCode";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

// Icons
import {
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

// Hooks
import { useSessions } from "~/hooks/use-sessions";
import { useAuth } from "~/contexts/auth-context";

// Utils
import { formatDateTime, formatTime } from "~/lib/utils/date";
import { toast } from "sonner";
import { isAfter, parseISO } from "date-fns";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Psikotes ${params.sessionCode} - Syntegra` },
    { name: "description", content: "Akses tes psikologi online" },
  ];
}

export default function PsikotesSessionPage() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loginParticipant, logout } = useAuth();

  const [phone, setPhone] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { useGetPublicSessionByCode, useCheckParticipant } = useSessions();
  const checkParticipant = useCheckParticipant();

  // Get session data using the hook
  const {
    data: sessionData,
    isLoading: isValidatingSession,
    error: sessionError,
    refetch,
  } = useGetPublicSessionByCode(sessionCode || "");

  // Check if session has started using date-fns
  const hasSessionStarted = () => {
    if (!sessionData?.start_time) return false;
    try {
      const now = new Date();
      const startTime = parseISO(sessionData.start_time);
      return isAfter(now, startTime) || now.getTime() === startTime.getTime();
    } catch (error) {
      console.error("Error parsing session start time:", error);
      return false;
    }
  };

  // Check if session has ended using date-fns
  const hasSessionEnded = () => {
    if (!sessionData?.end_time) return false;
    try {
      const now = new Date();
      const endTime = parseISO(sessionData.end_time);
      return isAfter(now, endTime);
    } catch (error) {
      console.error("Error parsing session end time:", error);
      return false;
    }
  };

  // Check if session is currently active (between start and end time)
  const isSessionCurrentlyActive = () => {
    return hasSessionStarted() && !hasSessionEnded();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing session data:", error);
      toast.error("Gagal memperbarui data sesi");
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log("sessionData", sessionData);
  console.log("sessionCode", sessionCode);

  // // Check participant status when participants data is available and user is authenticated
  // useEffect(() => {
  //   if (participantsData && isAuthenticated && user) {
  //     const participant = participantsData.find(
  //       (p: any) => p.user_id === user.id
  //     );
  //     setParticipantStatus(participant?.status || null);
  //   }
  // }, [participantsData, isAuthenticated, user]);

  const handleCheckParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Nomor telepon harus diisi");
      return;
    }

    if (!sessionCode) {
      toast.error("Kode sesi tidak valid");
      return;
    }

    setIsLoggingIn(true);

    try {
      // Check if participant exists in the session
      const checkResult = await checkParticipant.mutateAsync({
        sessionCode: sessionCode,
        phone: phone.trim(),
      });

      console.log("checkResult", checkResult);

      if (checkResult.data.participant_exists) {
        // Participant found, proceed with login
        try {
          await loginParticipant({ phone: phone.trim() });
          toast.success("Login berhasil!", {
            description: `Selamat datang, ${
              checkResult.data.participant?.name || "Peserta"
            }!`,
          });
          navigate(`/psikotes/${sessionCode}/start`);
        } catch (loginError) {
          console.error("Login error:", loginError);
          toast.error("Gagal melakukan login", {
            description: "Terjadi kesalahan saat login. Silakan coba lagi.",
          });
        }
      } else {
        // Participant not found
        toast.error("Tidak terdaftar", {
          description:
            "Nomor telepon Anda tidak terdaftar dalam sesi psikotes ini. Hubungi administrator untuk bantuan.",
        });
      }
    } catch (error) {
      console.error("Check participant error:", error);
      // Error toast is already handled by the hook
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartTest = () => {
    if (sessionData && user) {
      // Navigate to test interface
      navigate(`/psikotes/${sessionCode}/start`);
    }
  };

  // Loading state
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

  // Return early if session data is not yet available
  if (!sessionData) {
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

  // Check if session is expired or not active using date-fns
  const isSessionExpired = hasSessionEnded();

  if (isSessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle className="text-gray-800">Sesi Telah Berakhir</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sesi psikotes <strong>{sessionData.session_name}</strong> telah
              berakhir pada {formatDateTime(sessionData.end_time)}.
            </p>
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate("/participant/dashboard")}
                  className="w-full"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Ke Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Kembali ke Beranda
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="pt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          <p className="text-xs text-muted-foreground">
            © 2025 Syntegra Services. Dikembangkan oleh{" "}
            <a
              href="https://oknum.studio"
              className="text-emerald-700 font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Oknum.Studio
            </a>
          </p>
        </div>
      </div>
    );
  }

  // User not authenticated - show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Akses Psikotes</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {sessionData.session_name}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Info */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>
                  {formatDateTime(sessionData.start_time)} -{" "}
                  {formatTime(sessionData.end_time)}
                </span>
              </div>
              {sessionData.target_position && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Posisi: {sessionData.target_position}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>
                  {sessionData.total_questions} soal dalam{" "}
                  {sessionData.session_modules?.length || 0} modul
                </span>
              </div>
            </div>

            {/* Session Status Warning */}
            {!hasSessionStarted() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Sesi Belum Dimulai</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Psikotes akan dimulai pada{" "}
                  {formatDateTime(sessionData.start_time)}. Tombol masuk akan
                  aktif ketika waktu tes telah tiba.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Gunakan tombol refresh untuk memperbarui status sesi.
                </p>
              </div>
            )}

            {/* Session Active Status */}
            {hasSessionStarted() && !hasSessionEnded() && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Sesi Sedang Berlangsung</span>
                </div>
                <p className="text-sm text-green-700">
                  Sesi psikotes sedang aktif. Anda dapat masuk dan mengerjakan
                  tes sekarang.
                </p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleCheckParticipant} className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium mb-2"
                >
                  Nomor Telepon
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoggingIn || !hasSessionStarted()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 cursor-pointer"
                  disabled={isLoggingIn || !hasSessionStarted()}
                >
                  {isLoggingIn ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Memverifikasi...
                    </>
                  ) : !hasSessionStarted() ? (
                    "Menunggu Waktu Tes"
                  ) : (
                    "Masuk ke Psikotes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoggingIn}
                  title="Perbarui data sesi"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Masukkan nomor telepon yang telah terdaftar untuk mengakses
              psikotes ini.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="pt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          <p className="text-xs text-muted-foreground">
            © 2025 Syntegra Services. Dikembangkan oleh{" "}
            <a
              href="https://oknum.studio"
              className="text-emerald-700 font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Oknum.Studio
            </a>
          </p>
        </div>
      </div>
    );
  }

  // User authenticated and registered - show test interface
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
            {sessionData.session_name}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Details */}
          <Button onClick={handleStartTest}>Mulai Psikotes</Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="pt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        <p className="text-xs text-muted-foreground">
          © 2025 Syntegra Services. Dikembangkan oleh{" "}
          <a
            href="https://oknum.studio"
            className="text-emerald-700 font-bold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Oknum.Studio
          </a>
        </p>
      </div>
    </div>
  );
}
