// Book template definitions
// Phase 3.2: Book Templates & Auto-Assembly

export interface TemplateSection {
  title: string;
  photoSource: 'date_range' | 'month' | 'all_favorites';
  dateOffset?: { months: number };
}

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  suggestedPageCount: number;
  icon: string;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'baby_first_year',
    name: "Baby's First Year",
    description: "12 monthly sections documenting your baby's first year",
    sections: Array.from({ length: 12 }, (_, i) => ({
      title: `Month ${i + 1}`,
      photoSource: 'month' as const,
      dateOffset: { months: i },
    })),
    suggestedPageCount: 48,
    icon: 'Baby',
  },
  {
    id: 'year_in_review',
    name: 'Year in Review',
    description: 'Your best photos from the entire year, auto-organized by season',
    sections: [
      { title: 'Winter', photoSource: 'date_range', dateOffset: { months: 0 } },
      { title: 'Spring', photoSource: 'date_range', dateOffset: { months: 3 } },
      { title: 'Summer', photoSource: 'date_range', dateOffset: { months: 6 } },
      { title: 'Fall', photoSource: 'date_range', dateOffset: { months: 9 } },
    ],
    suggestedPageCount: 36,
    icon: 'Calendar',
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'A single trip or vacation, date-range based',
    sections: [{ title: 'The Trip', photoSource: 'date_range' }],
    suggestedPageCount: 24,
    icon: 'MapPin',
  },
  {
    id: 'our_family',
    name: 'Our Family',
    description: 'A collaborative book from Circle photos',
    sections: [{ title: 'Our Family', photoSource: 'all_favorites' }],
    suggestedPageCount: 36,
    icon: 'Users',
  },
  {
    id: 'blank',
    name: 'Blank Book',
    description: 'Start from scratch — pick your own photos and layout',
    sections: [],
    suggestedPageCount: 24,
    icon: 'BookOpen',
  },
];

export function getBookTemplate(templateId: string): BookTemplate | undefined {
  return BOOK_TEMPLATES.find((t) => t.id === templateId);
}
