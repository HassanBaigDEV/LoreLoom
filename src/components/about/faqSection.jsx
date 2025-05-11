"use client";

import React, { useState } from "react";
import { Box, Typography, Button, Tabs, Tab, Paper, Divider, IconButton } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import MessageIcon from '@mui/icons-material/Message';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { faqData, categories } from '@/lib/faq-data';
import Collapse from '@mui/material/Collapse';
import Pagination from '@mui/material/Pagination';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const QUESTIONS_PER_PAGE = 6;

export default function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestion, setSuggestion] = useState({ question: "", email: "" });
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filter by category
  const filteredQuestions = selectedCategory === 'All'
    ? faqData
    : faqData.filter(q => q.category === selectedCategory);

  // Pagination
  const pageCount = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);

  // Recently added (last 2)
  const recentlyAdded = faqData.slice(-2);

  // Find the index of a question in filteredQuestions
  const findQuestionPage = (id) => {
    const idx = filteredQuestions.findIndex(q => q.id === id);
    if (idx === -1) return 0;
    return Math.floor(idx / QUESTIONS_PER_PAGE);
  };

  // Handle clicking a recently added question
  const handleRecentlyAddedClick = (id) => {
    const newPage = findQuestionPage(id);
    setPage(newPage);
    setExpandedId(id);
  };

  // Handle clicking a question to expand/collapse
  const handleQuestionClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitSuggestion = () => {
    if (suggestion.question.trim()) {
      alert("Thank you for your suggestion! We'll review it and get back to you.");
      setSuggestion({ question: "", email: "" });
      setShowSuggestionForm(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f6faff', minHeight: '100vh', py: 6 }}>
      <Typography variant="h4" align="center" fontWeight={700} color="#1e3a8a" mb={1}>
        Frequently Asked Questions
      </Typography>
      <Typography align="center" color="text.secondary" mb={4}>
        Explore our FAQ section in different ways. Choose the tab below to see various FAQ design approaches.
      </Typography>
      <Box display="flex" justifyContent="center" mb={3}>
        <Tabs
          value={selectedCategory}
          onChange={(_, v) => { setSelectedCategory(v); setPage(0); setExpandedId(null); }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            bgcolor: '#fff',
            borderRadius: 2,
            boxShadow: 1,
            minWidth: 320,
            px: 2
          }}
        >
          <Tab label="All" value="All" sx={{ fontWeight: 500 }} />
          {categories.map(cat => (
            <Tab key={cat} label={cat} value={cat} sx={{ fontWeight: 500 }} />
          ))}
        </Tabs>
      </Box>
      <Box display="flex" justifyContent="center">
        <Paper elevation={2} sx={{ width: '100%', maxWidth: 600, p: { xs: 2, md: 4 }, borderRadius: 3, bgcolor: '#fafdff' }}>
          {/* Community FAQ header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography fontWeight={600} color="#1e3a8a" fontSize={18}>
              Community-Enhanced FAQ
            </Typography>
            {/* <Button
              variant="outlined"
              startIcon={<MessageIcon />}
              size="small"
              onClick={() => setShowSuggestionForm(!showSuggestionForm)}
              sx={{ borderRadius: 2 }}
            >
              Suggest a question
            </Button> */}
          </Box>
          <Typography color="text.secondary" fontSize={14} mb={2}>
            Leverage user feedback and contributions.
          </Typography>
          {/* Suggestion form */}
          {/* {showSuggestionForm && (
            <Box bgcolor="#f0f4fa" p={2} borderRadius={2} mb={2} border="1px solid #e3e8f0">
              <Typography fontWeight={500} mb={1}>Suggest a new question</Typography>
              <Box mb={1}>
                <input
                  type="text"
                  placeholder="Your question"
                  value={suggestion.question}
                  onChange={e => setSuggestion(s => ({ ...s, question: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8 }}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={suggestion.email}
                  onChange={e => setSuggestion(s => ({ ...s, email: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </Box>
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Button variant="outlined" size="small" onClick={() => setShowSuggestionForm(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                <Button variant="contained" size="small" onClick={handleSubmitSuggestion} sx={{ borderRadius: 2 }} disabled={!suggestion.question.trim()}>Submit</Button>
              </Box>
            </Box>
          )} */}
          {/* Recently added as vertical list */}
          <Box bgcolor="#e8f1fd" borderRadius={2} p={2} mb={2} border="1px solid #d1e3fa">
            <Typography fontWeight={500} color="primary.dark" mb={1} display="flex" alignItems="center">
              <AccessTimeIcon sx={{ fontSize: 18, mr: 1 }} /> Recently added questions
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'block' }}>
              {recentlyAdded.map(item => (
                <li key={item.id} style={{ marginBottom: 8 }}>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ color: 'primary.main', textTransform: 'none', fontWeight: 500, px: 0, minWidth: 0, justifyContent: 'flex-start' }}
                    onClick={() => handleRecentlyAddedClick(item.id)}
                  >
                    {item.question}
                  </Button>
                </li>
              ))}
            </Box>
          </Box>
          {/* Question list with expandable answers */}
          <Divider sx={{ mb: 2 }} />
          {/* <Typography color="text.secondary" fontSize={13} mb={1}>
            Questions sorted by helpfulness
          </Typography> */}
          <Box>
            {paginatedQuestions.map(item => (
              <Paper key={item.id} elevation={0} sx={{ mb: 1.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid #e3e8f0', p: 0 }}>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: 'space-between',
                    color: 'text.primary',
                    fontWeight: 500,
                    fontSize: 15,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={() => handleQuestionClick(item.id)}
                >
                  <span>{item.question}</span>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ThumbUpIcon sx={{ fontSize: 18, color: 'primary.light' }} />
                    <Typography fontSize={13} color="text.secondary">{item.helpful || 0}</Typography>
                  </Box>
                </Button>
                <Collapse in={expandedId === item.id} timeout="auto" unmountOnExit>
                  <Box sx={{ px: 3, py: 2, bgcolor: '#f6faff', borderTop: '1px solid #e3e8f0' }}>
                    <Typography fontSize={15} color="text.secondary">{item.answer}</Typography>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Box>
          {/* Pagination - MUI Pagination styled */}
          {pageCount > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
              <Pagination
                count={pageCount}
                page={page + 1}
                onChange={(_, value) => { setPage(value - 1); setExpandedId(null); }}
                color="primary"
                size={isMobile ? "small" : "large"}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 2}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#1e3a8a",
                  },
                  "& .Mui-selected": {
                    bgcolor: "#1e3a8a !important",
                    color: "white !important",
                  },
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
} 