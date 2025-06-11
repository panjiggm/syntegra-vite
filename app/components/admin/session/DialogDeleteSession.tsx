import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useSessionDialogStore } from "~/stores/use-session-dialog-store";
import { useSessions } from "~/hooks/use-sessions";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export function DialogDeleteSession() {
  const {
    isDeleteSessionModalOpen,
    deleteSessionId,
    deleteSessionName,
    deleteSessionCode,
    closeDeleteSessionModal,
  } = useSessionDialogStore();
  const navigate = useNavigate();

  // Debug logging
  console.log("Dialog state:", {
    isDeleteSessionModalOpen,
    deleteSessionId,
    deleteSessionName,
    deleteSessionCode,
  });

  const { useDeleteSession } = useSessions();
  const deleteSessionMutation = useDeleteSession();

  const [confirmationText, setConfirmationText] = useState("");
  const [isTypingConfirmation, setIsTypingConfirmation] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isDeleteSessionModalOpen) {
      setConfirmationText("");
      setIsTypingConfirmation(false);
    }
  }, [isDeleteSessionModalOpen]);

  const requiredConfirmationText = "HAPUS SESI";
  const isConfirmationValid =
    confirmationText.trim() === requiredConfirmationText;

  const handleDelete = async () => {
    if (!deleteSessionId || !isConfirmationValid) return;

    try {
      // Show loading toast
      const loadingToast = toast.loading("Menghapus sesi...", {
        description: "Mohon tunggu, sedang memproses penghapusan sesi",
      });

      await deleteSessionMutation.mutateAsync(deleteSessionId);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success toast
      toast.success("Sesi berhasil dihapus!", {
        description: `Sesi ${deleteSessionName} (${deleteSessionCode}) telah dihapus dari sistem`,
        duration: 6000,
      });

      // Close modal and redirect
      closeDeleteSessionModal();
      navigate("/admin/sessions");
    } catch (error: any) {
      console.error("Delete session error:", error);

      // Dismiss any loading toast
      toast.dismiss();

      // Determine error message
      let errorMessage = "Terjadi kesalahan saat menghapus sesi";

      if (error.message) {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes("not found")) {
          errorMessage = "Sesi tidak ditemukan atau sudah dihapus";
        } else if (
          errorMsg.includes("permission") ||
          errorMsg.includes("unauthorized") ||
          errorMsg.includes("access denied")
        ) {
          errorMessage = "Anda tidak memiliki izin untuk menghapus sesi ini";
        } else if (
          errorMsg.includes("active") &&
          errorMsg.includes("participants")
        ) {
          errorMessage =
            "Sesi tidak dapat dihapus karena sedang aktif dan memiliki peserta";
        } else if (
          errorMsg.includes("attempts") ||
          errorMsg.includes("test attempts")
        ) {
          errorMessage =
            "Sesi tidak dapat dihapus karena sudah memiliki hasil tes";
        } else if (
          errorMsg.includes("constraint") ||
          errorMsg.includes("dependencies")
        ) {
          errorMessage =
            "Sesi tidak dapat dihapus karena masih memiliki data terkait";
        } else {
          errorMessage = error.message;
        }
      }

      // Show error toast
      toast.error("Gagal menghapus sesi", {
        description: errorMessage,
        duration: 8000,
      });
    }
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationText(value);
    setIsTypingConfirmation(true);
  };

  return (
    <AlertDialog
      open={isDeleteSessionModalOpen}
      onOpenChange={closeDeleteSessionModal}
    >
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                Hapus Sesi
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                Tindakan ini tidak dapat dibatalkan
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-2">
                  Anda akan menghapus sesi tes psikotes:
                </p>
                <div className="space-y-1">
                  <p className="text-red-700 font-semibold text-base">
                    {deleteSessionName}
                  </p>
                  <p className="text-red-600 font-mono text-sm">
                    Kode: {deleteSessionCode}
                  </p>
                </div>
                <p className="text-red-600 mt-2 text-xs">
                  Semua data terkait sesi ini akan dihapus secara permanen,
                  termasuk:
                </p>
                <ul className="text-red-600 text-xs mt-1 ml-3 list-disc space-y-1">
                  <li>Konfigurasi sesi dan pengaturan</li>
                  <li>Daftar peserta yang terdaftar</li>
                  <li>Modul tes yang dikonfigurasi</li>
                  <li>Hasil tes dan jawaban peserta</li>
                  <li>Riwayat aktivitas sesi</li>
                  <li>Laporan dan statistik sesi</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Untuk melanjutkan, ketik{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">
                  {requiredConfirmationText}
                </span>
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => handleConfirmationChange(e.target.value)}
                placeholder="Ketik konfirmasi untuk melanjutkan"
                className={`mt-2 ${
                  isTypingConfirmation
                    ? isConfirmationValid
                      ? "border-green-500 focus-visible:ring-green-500"
                      : "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                disabled={deleteSessionMutation.isPending}
              />
            </div>

            {isTypingConfirmation && !isConfirmationValid && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Teks konfirmasi tidak sesuai
              </p>
            )}

            {isConfirmationValid && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                ✓ Konfirmasi valid - sesi siap dihapus
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleteSessionMutation.isPending}
            onClick={closeDeleteSessionModal}
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || deleteSessionMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteSessionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Sesi
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
