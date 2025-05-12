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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [cameFromDiscover, setCameFromDiscover] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [showNoPassagesModal, setShowNoPassagesModal] = useState(false);

  useEffect(() => {
    // Check if user came from discover page
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      setCameFromDiscover(referrer.includes("/discover"));
    }
  }, []);

  const handleBack = () => {
    if (cameFromDiscover) {
      router.push("/discover");
    } else {
      router.back();
    }
  };

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
        author: storyResponse.data.author,
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

  useEffect(() => {
    if (!loading && passages.length === 0) {
      setShowNoPassagesModal(true);
    }
  }, [loading, passages]);

  const handleNoPassagesModalClose = () => {
    setShowNoPassagesModal(false);
    router.back();
  };

  async function handleDownloadPDF() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      // Page and margin settings (in mm)
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15,
      };
      const contentWidth = pageWidth - margin.left - margin.right;
      const contentHeight = pageHeight - margin.top - margin.bottom;

      // Create off-screen container
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = `${contentWidth}mm`;
      document.body.appendChild(pdfContainer);

      // Helper to build a page section
      function createSection(html) {
        const section = document.createElement("div");
        section.style.boxSizing = "border-box";
        section.style.width = "100%";
        section.style.padding = "0";
        section.innerHTML = html;
        return section;
      }

      // Fetch author information
      try {
        // Get author ID from story details
        const authorId = storyDetails.author || "";
        if (authorId) {
          const authorResponse = await storyApiClient.get(
            `/user/author/${authorId}`
          );
          const authorData = authorResponse.data;
          setAuthorName(
            `${authorData.first_name} ${authorData.last_name}`.trim()
          );
          if (!authorName) {
            setAuthorName(authorData.username || "Unknown Author");
          }
        } else {
          setAuthorName(
            `${user.first_name} ${user.last_name}`.trim() || "Unknown Author"
          );
        }
      } catch (error) {
        console.error("Error fetching author information:", error);
        setAuthorName(
          `${user.first_name} ${user.last_name}`.trim() || "Unknown Author"
        );
      }

      // 1. Cover
      const coverHTML = `
        <div style="height:${contentHeight}mm; display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:avoid;">
          <h1 style="font-size:4rem;margin-bottom:20px;font-family:'Playfair Display',serif;">${
            storyDetails.title
          }</h1>
          <h4 style="color:#4b5563;margin-bottom:40px;font-style:italic;">${
            storyDetails.genre
          }</h4>
          <div style="width:200px;border-bottom:1px solid #1f2937;margin:40px 0;"></div>
          <h6 style="color:#6b7280;text-transform:uppercase;letter-spacing:4px;">A Novel by ${
            authorName || "Unknown Author"
          }</h6>
        </div>
      `;
      pdfContainer.appendChild(createSection(coverHTML));

      // 2. Abstract - fix height to avoid overflow
      const abstractHTML = `
        <div style="display:flex;flex-direction:column;justify-content:flex-start;padding:10mm 10mm 30mm;box-sizing:border-box;page-break-before:avoid;page-break-after:always;">
          <h3 style="font-family:'Playfair Display',serif;font-size:2.5rem;text-align:center;margin-bottom:30px;">Abstract</h3>
          <div style="max-width:800px;margin:0 auto;background-color:#f9fafb;padding:20px;border-radius:8px;">
            <p style="font-style:italic;font-size:1.2rem;line-height:1.8;text-align:justify;">${storyDetails.premise}</p>
          </div>
        </div>
      `;
      pdfContainer.appendChild(createSection(abstractHTML));

      // 3. Chapters
      const chapters = passages.reduce((acc, p) => {
        const id = p.outline_point_id;
        if (!acc[id])
          acc[id] = {
            title:
              storyDetails.outline.find((o) => o.number === id)?.title ||
              "Untitled",
            number: id,
            passages: [],
          };
        acc[id].passages.push(p);
        return acc;
      }, {});
      Object.values(chapters).forEach((ch) => {
        const passagesHTML = ch.passages
          .map(
            (p) =>
              `<div style="margin-bottom:10px;text-align:justify;text-indent:2em;">${p.content
                .split("\n")
                .map((l) => `<p>${l}</p>`)
                .join("")}</div>`
          )
          .join("");
        const chapterHTML = `
          <div style="padding:0 10mm; box-sizing:border-box;">
            <div style="margin-bottom:20px;border-bottom:2px solid #e5e7eb;padding-bottom:10px;">
              <h3 style="font-family:'Playfair Display',serif;font-size:2rem;color:#1f2937;">${ch.title}</h3>
              <h5 style="color:#4b5563;font-style:italic;margin-top:5px;">Chapter ${ch.number}</h5>
            </div>
            ${passagesHTML}
          </div>
        `;
        pdfContainer.appendChild(createSection(chapterHTML));
      });

      // Generate PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const sections = Array.from(pdfContainer.children);

      // Process each section one by one with better page control
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];

        // Render section to canvas
        const canvas = await html2canvas(sec, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#fff",
        });

        const pxWidth = canvas.width;
        const pxPerMm = pxWidth / contentWidth;
        const pagePxHeight = Math.ceil(contentHeight * pxPerMm);

        // Skip empty canvases
        if (canvas.height < 20) continue;

        // Process page slices for this section
        const pageCount = Math.ceil(canvas.height / pagePxHeight);

        for (let pageNum = 0; pageNum < pageCount; pageNum++) {
          // Calculate slice dimensions
          const y = pageNum * pagePxHeight;
          const sliceH = Math.min(pagePxHeight, canvas.height - y);

          // Skip tiny slices
          if (sliceH < 20) continue;

          // Create page canvas
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = pxWidth;
          pageCanvas.height = sliceH;
          const ctx = pageCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, y, pxWidth, sliceH, 0, 0, pxWidth, sliceH);

          // Check if slice is empty (all white)
          const imageData = ctx.getImageData(
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          ).data;
          let hasContent = false;
          // Sample the image data (check every 100th pixel to save processing time)
          for (let p = 0; p < imageData.length; p += 400) {
            // If RGB != white or alpha != 0, then there's content
            if (
              (imageData[p] !== 255 ||
                imageData[p + 1] !== 255 ||
                imageData[p + 2] !== 255) &&
              imageData[p + 3] !== 0
            ) {
              hasContent = true;
              break;
            }
          }

          // Skip empty slices
          if (!hasContent) continue;

          // Add a new page for all except the first page of the document
          if (!(i === 0 && pageNum === 0)) {
            pdf.addPage();
          }

          // Add image to PDF
          const imgData = pageCanvas.toDataURL("image/png");
          pdf.addImage(
            imgData,
            "PNG",
            margin.left,
            margin.top,
            contentWidth,
            sliceH / pxPerMm
          );

          // Add footer for chapters (not cover or abstract)
          if (i >= 2) {
            pdf.setFontSize(9);
            pdf.setTextColor(107, 114, 128);
            pdf.text(
              storyDetails.title,
              margin.left,
              pageHeight - margin.bottom + 5
            );
            const currentPage = pdf.getNumberOfPages();
            pdf.text(
              `Page ${currentPage - 2}`, // Subtract cover & abstract
              pageWidth / 2,
              pageHeight - margin.bottom + 5,
              { align: "center" }
            );
          }
        }
      }

      pdf.save(`${storyDetails.title || "story"}.pdf`);
      document.body.removeChild(pdfContainer);
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Failed to generate PDF");
    }
  }

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
                A Novel by {authorName || "Unknown Author"}
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
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                background: "linear-gradient(45deg, #22c55e, #16a34a)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              <IconButton onClick={handleBack}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {storyDetails.title || "Story View"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Download as PDF">
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  sx={{
                    bgcolor: "rgb(34 197 94)",
                    "&:hover": { bgcolor: "rgb(22 163 74)" },
                  }}
                >
                  PDF
                </Button>
              </Tooltip>
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

          {/* No Passages Modal */}
          <Dialog
            open={showNoPassagesModal}
            onClose={handleNoPassagesModalClose}
            aria-labelledby="no-passages-dialog-title"
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
                width: '100%'
              }
            }}
          >
            <DialogTitle 
              id="no-passages-dialog-title"
              sx={{
                textAlign: 'center',
                color: 'rgb(34 197 94)',
                fontWeight: 600,
                fontSize: '1.25rem',
                pt: 3
              }}
            >
              Story Not Written
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', px: 4, py: 2 }}>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                This story has not been written yet. Please write some passages first.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
              <Button 
                onClick={handleNoPassagesModalClose} 
                variant="contained"
                sx={{
                  bgcolor: 'rgb(34 197 94)',
                  '&:hover': { bgcolor: 'rgb(22 163 74)' },
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Go Back
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
