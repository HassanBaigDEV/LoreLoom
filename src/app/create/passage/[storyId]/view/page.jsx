"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import { Toaster, toast } from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PassageViewPage({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [loading, setLoading] = useState(true);
  const [passages, setPassages] = useState([]);
  const [storyDetails, setStoryDetails] = useState({ title: "", genre: "" });
  const [currentPage, setCurrentPage] = useState(0);

  const fetchPassages = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const [passagesResponse, storyResponse] = await Promise.all([
        storyApiClient.get(`/draft/passages/${storyId}`, {
          params: { user_id: user?.id },
        }),
        storyApiClient.get(`/plan/story-elements/${storyId}`, {
          params: { user_id: user?.id },
        }),
      ]);

      const sortedPassages = passagesResponse.data.sort((a, b) => {
        const outlineDiff =
          parseInt(a.outline_number) - parseInt(b.outline_number);
        if (outlineDiff !== 0) return outlineDiff;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setPassages(sortedPassages);
      setStoryDetails({
        title: storyResponse.data.title,
        genre: storyResponse.data.genre,
        premise: storyResponse.data.premise,
        setting: storyResponse.data.setting,
        outline: storyResponse.data.outline,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load story content");
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchPassages();
  }, [fetchPassages]);

  const handleDownloadPDF = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      // Create PDF container
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = "210mm";
      document.body.appendChild(pdfContainer);

      // Generate all pages content
      const allPagesContent = document.createElement("div");
      allPagesContent.className = "pdf-content-container";
      allPagesContent.style.width = "210mm";
      allPagesContent.style.minHeight = "297mm";

      // 1. Add cover page
      const coverPage = document.createElement("div");
      coverPage.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 4rem; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
            ${storyDetails.title}
          </h1>
          <h4 style="color: #4b5563; margin-bottom: 40px; font-style: italic;">
            ${storyDetails.genre}
          </h4>
          <div style="width: 200px; border-bottom: 1px solid #1f2937; margin: 40px 0;"></div>
          <h6 style="color: #6b7280; text-transform: uppercase; letter-spacing: 4px;">
            A Novel by ${user.first_name} ${user.last_name}
          </h6>
        </div>
      `;
      allPagesContent.appendChild(coverPage);

      // 2. Add abstract page
      const abstractPage = document.createElement("div");
      abstractPage.innerHTML = `
        <div style="padding: 20mm; min-height: 297mm;">
          <h3 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; text-align: center; margin-bottom: 40px;">
            Abstract
          </h3>
          <div style="max-width: 800px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
            <p style="font-style: italic; font-size: 1.2rem; line-height: 1.8; text-align: justify;">
              ${storyDetails.premise}
            </p>
          </div>
        </div>
      `;
      allPagesContent.appendChild(abstractPage);

      // 3. Add chapter pages
      const chapters = passages.reduce((acc, passage) => {
        const key = passage.outline_point_id;
        if (!acc[key]) {
          acc[key] = {
            passages: [],
            outlineTitle:
              storyDetails.outline?.find((o) => o.number === key)?.title ||
              "Untitled Chapter",
            outlineNumber: key,
          };
        }
        acc[key].passages.push(passage);
        return acc;
      }, {});

      Object.values(chapters).forEach((chapter) => {
        const chapterPage = document.createElement("div");
        chapterPage.innerHTML = `
          <div style="padding: 20mm; min-height: 297mm;">
            <div style="margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
              <h3 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #1f2937;">
                ${chapter.outlineTitle}
              </h3>
              <h5 style="color: #4b5563; font-style: italic; margin-top: 10px;">
                Chapter ${chapter.outlineNumber}
              </h5>
            </div>
            ${chapter.passages
              .map(
                (p) => `
              <div style="margin-bottom: 20px; text-align: justify; text-indent: 2em;">
                ${p.content
                  .split("\n")
                  .map((line) => `<p>${line}</p>`)
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
        `;
        allPagesContent.appendChild(chapterPage);
      });

      pdfContainer.appendChild(allPagesContent);

      // Generate PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pages = Array.from(
        pdfContainer.querySelectorAll(".pdf-content-container > div")
      );

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`${storyDetails.title || "story"}.pdf`);
      document.body.removeChild(pdfContainer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadWord = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/draft/passages/${storyId}/export/word`,
        {
          params: { user_id: user?.id },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${storyDetails.title || "story"}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Word document:", error);
      toast.error("Failed to download Word document");
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const totalPages = 2 + (storyDetails.outline?.length || 0);

  // PDF Viewer Style Content
  const renderPDFContent = () => {
    // Group passages by outline point and sort
    const groupedChapters = passages.reduce((acc, passage) => {
      const key = passage.outline_point_id;
      const outlineItem = storyDetails.outline?.find((o) => o.number === key);
      if (!acc[key]) {
        acc[key] = {
          passages: [],
          outlineTitle: outlineItem?.title || "Untitled Chapter",
          outlineNumber: outlineItem?.number || 0,
        };
      }
      acc[key].passages.push(passage);
      return acc;
    }, {});

    // Convert to sorted array
    const chapters = Object.entries(groupedChapters)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([id, data]) => ({
        outlineId: parseInt(id),
        ...data,
        passages: data.passages.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));

    return (
      <Box sx={{ position: "relative" }}>
        {/* Current Page Content */}
        {currentPage === 0 && (
          <Box
            sx={{
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Cover Page */}
            <Box
              sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                pageBreakAfter: "always",
                "&::after": {
                  content: '"Page " counter(page)',
                  counterIncrement: "page",
                  position: "absolute",
                  bottom: 40,
                  right: 40,
                  color: "#6b7280",
                  fontSize: "0.9rem",
                },
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: "4rem",
                  fontWeight: 700,
                  mb: 2,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: 2,
                  color: "#1f2937",
                }}
              >
                {storyDetails.title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: "#4b5563",
                  mb: 4,
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                {storyDetails.genre}
              </Typography>
              <Divider
                sx={{
                  width: "200px",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  my: 4,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: 4,
                }}
              >
                A Novel by{" "}
                {JSON.parse(localStorage.getItem("user"))?.first_name &&
                JSON.parse(localStorage.getItem("user"))?.last_name
                  ? `${JSON.parse(localStorage.getItem("user"))?.first_name} ${
                      JSON.parse(localStorage.getItem("user"))?.last_name
                    }`
                  : "Author"}
              </Typography>
            </Box>
          </Box>
        )}

        {currentPage === 1 && (
          <Box sx={{ p: 4 }}>
            {/* Premise Page */}
            <Box
              sx={{
                pageBreakAfter: "always",
                minHeight: "100vh",
                p: 4,
                position: "relative",
                "&::after": {
                  content: '"Page " counter(page)',
                  counterIncrement: "page",
                  position: "absolute",
                  bottom: 40,
                  right: 40,
                  color: "#6b7280",
                  fontSize: "0.9rem",
                },
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "2.5rem",
                  mb: 4,
                  textAlign: "center",
                }}
              >
                Abstract
              </Typography>
              <Box
                sx={{
                  maxWidth: "800px",
                  mx: "auto",
                  bgcolor: "#f9fafb",
                  p: 4,
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: "italic",
                    fontSize: "1.3rem",
                    lineHeight: 1.8,
                    color: "#374151",
                    textAlign: "justify",
                  }}
                >
                  {storyDetails.premise}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {currentPage >= 2 && (
          <Box sx={{ p: 4 }}>
            {/* Chapter Header */}
            <Box
              sx={{
                mb: 4,
                borderBottom: "2px solid #e5e7eb",
                pb: 2,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "2.5rem",
                  color: "#1f2937",
                }}
              >
                {chapters[currentPage - 2].outlineTitle}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "#4b5563",
                  fontStyle: "italic",
                  mt: 1,
                }}
              >
                Chapter {chapters[currentPage - 2].outlineNumber}
              </Typography>
            </Box>

            {/* Chapter Content */}
            {chapters[currentPage - 2].passages.map((passage, index) => (
              <Box key={passage.id} sx={{ mb: 4 }}>
                <Typography
                  component="div"
                  sx={{
                    whiteSpace: "pre-wrap",
                    textAlign: "justify",
                    textIndent: "2em",
                    "& p": { marginBottom: 3 },
                  }}
                >
                  {passage.content.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </Typography>
              </Box>
            ))}

            {/* Chapter Footer */}
            <Box
              sx={{
                position: "absolute",
                bottom: 80,
                left: 40,
                right: 40,
                display: "flex",
                justifyContent: "space-between",
                color: "#6b7280",
                fontSize: "0.9rem",
                borderTop: "1px solid #e5e7eb",
                pt: 2,
              }}
            >
              <span>{storyDetails.title}</span>
              <span>Chapter {chapters[currentPage - 2].outlineNumber}</span>
            </Box>
          </Box>
        )}

        {/* Pagination Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 4,
            gap: 1,
            p: 2,
            bgcolor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 4,
          }}
        >
          <IconButton
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            sx={{
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "50%",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(34, 197, 94, 0.1)",
                transform: "scale(1.1)",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
                borderColor: "rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <ArrowBackIcon sx={{ color: "rgb(34 197 94)" }} />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              mx: 2,
              px: 2,
              py: 1,
              bgcolor: "rgba(0, 0, 0, 0.03)",
              borderRadius: 3,
            }}
          >
            {Array.from({ length: totalPages }).map((_, index) => (
              <IconButton
                key={index}
                onClick={() => setCurrentPage(index)}
                sx={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor:
                    index === currentPage ? "rgb(34 197 94)" : "transparent",
                  color: index === currentPage ? "white" : "text.secondary",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor:
                      index === currentPage
                        ? "rgb(22 163 74)"
                        : "rgba(34, 197, 94, 0.1)",
                    transform: "scale(1.1)",
                  },
                  fontSize: "0.9rem",
                  fontWeight: index === currentPage ? 700 : 500,
                }}
              >
                {index + 1}
              </IconButton>
            ))}
          </Box>

          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            sx={{
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "50%",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(34, 197, 94, 0.1)",
                transform: "scale(1.1)",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
                borderColor: "rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <ArrowForwardIcon sx={{ color: "rgb(34 197 94)" }} />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <ProtectedRoute>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          py: 4,
        }}
      >
        <Toaster position="top-right" />
        <Container maxWidth="lg">
          {/* Header */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {storyDetails.title || "Story View"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Download as PDF">
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={handleDownloadPDF}
                  disabled={loading}
                >
                  PDF
                </Button>
              </Tooltip>
              {/* <Tooltip title="Download as Word">
                <Button
                  variant="outlined"
                  startIcon={<WordIcon />}
                  onClick={handleDownloadWord}
                  disabled={loading}
                >
                  Word
                </Button>
              </Tooltip> */}
            </Stack>
          </Box>

          {/* Content */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress sx={{ color: "rgb(34 197 94)" }} />
            </Box>
          ) : (
            <Paper
              className="pdf-content-container"
              elevation={3}
              sx={{
                p: 4,
                minHeight: "80vh",
                bgcolor: "white",
                fontFamily: '"Crimson Text", serif',
                fontSize: "1.2rem",
                lineHeight: 1.8,
                position: "relative",
                boxShadow: 3,
                borderRadius: 2,
                transform: "translateY(0)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 6,
                },
              }}
            >
              {renderPDFContent()}
            </Paper>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
