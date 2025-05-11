export type FAQItem = {
  id: string
  question: string
  answer: string
  category: string
  helpful?: number
  notHelpful?: number
  imageUrl?: string
  videoUrl?: string
}

export const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How do I download my story as a PDF?",
    answer: "You can download your story as a PDF by clicking the 'Download' button in the story editor. The PDF will include all your passages, formatting, and any images you've added to your story. The download feature is available for both individual passages and complete stories.",
    category: "Features",
    helpful: 124,
  },
  {
    id: "2",
    question: "How does collaboration work in LoreLoom?",
    answer: "LoreLoom allows multiple users to collaborate on a story in real-time. You can invite collaborators via email, and they can edit the story simultaneously. Each collaborator's changes are tracked and can be reviewed before being merged into the main story. You can also set different permission levels for each collaborator.",
    category: "Collaboration",
    helpful: 98,
  },
  {
    id: "3",
    question: "Can I lock specific passages during collaboration?",
    answer: "Yes, you can lock specific passages to prevent other collaborators from editing them. This is useful when you want to protect certain parts of your story while allowing others to work on different sections. The lock feature helps maintain consistency and prevents conflicts during collaborative writing.",
    category: "Collaboration",
    helpful: 87,
  },
  {
    id: "4",
    question: "How do I share my story with others?",
    answer: "You can share your story by generating a shareable link or inviting specific users via email. You can control the level of access (view-only or edit) for each person you share with. Shared stories can be accessed through the link or directly in the recipient's dashboard.",
    category: "Sharing",
    helpful: 156,
  },
  {
    id: "5",
    question: "What is the story planning phase?",
    answer: "The story planning phase is where you can outline your story's structure, create character profiles, and organize your plot points before writing. This helps you maintain consistency and track your story's development. You can use our planning tools to create mind maps, character sheets, and plot outlines.",
    category: "Features",
    helpful: 76,
  },
  {
    id: "6",
    question: "How do I change my story's cover?",
    answer: "You can change your story's cover by going to the story settings and clicking on the cover image. You can upload a new image or choose from our library of cover templates. The cover editor allows you to customize text, colors, and layout to create a professional-looking cover.",
    category: "Features",
    helpful: 62,
  },
  {
    id: "7",
    question: "How are passages generated?",
    answer: "Passages are generated based on your story's structure and planning. You can create new passages manually or use our AI-assisted writing tools to help generate content while maintaining your story's consistency. The AI tools can help with plot development, character dialogue, and scene descriptions.",
    category: "Features",
    helpful: 45,
  },
  {
    id: "8",
    question: "Can I export my story in different formats?",
    answer: "Yes! LoreLoom allows you to export your stories to multiple formats including PDF, DOCX, and EPUB. Premium users also get access to specialized formats for screenplays and graphic novels. All exports maintain your formatting and images.",
    category: "Features",
    helpful: 93,
  },
  {
    id: "9",
    question: "How do I organize my story's structure?",
    answer: "LoreLoom provides intuitive tools for organizing your story's structure. You can create chapters, scenes, and sub-scenes, and easily rearrange them using drag-and-drop functionality. The structure view gives you a clear overview of your story's organization.",
    category: "Features",
    helpful: 118,
  },
  {
    id: "10",
    question: "Is my work secure and private?",
    answer: "Absolutely. LoreLoom uses industry-standard encryption to protect your data. Your stories remain private unless you choose to share them. We never claim ownership of your creative work and regularly backup your content.",
    category: "Security",
    helpful: 39,
  },
]

export const popularSearches = ["collaboration", "export", "planning", "sharing", "security"]

export const categories = [
  "Features",
  "Collaboration",
  "Sharing",
  "Security",
] 