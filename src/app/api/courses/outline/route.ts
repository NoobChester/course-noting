import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { UNSWCourseOutline, CourseMeta } from "@/lib/types";

const BASE_DIR = process.cwd();
const COURSES_BASE_DIR = path.join(BASE_DIR, "courses");

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseWeekString(weekStr: string): { week: number; weekLabel: string; dateRange: string } {
  const match = weekStr.match(/Week\s*(\d+)(?:\s*:\s*(.*))?/i);
  if (match) {
    const weekNum = parseInt(match[1], 10);
    return {
      week: weekNum,
      weekLabel: `Week ${weekNum}`,
      dateRange: match[2] ? match[2].trim() : ""
    };
  }
  return {
    week: 1,
    weekLabel: weekStr.trim(),
    dateRange: ""
  };
}

export async function fetchUNSWCourseOutline(courseCode: string, requestedYear?: string, requestedTerm?: string): Promise<{
  outline: UNSWCourseOutline | null;
  closestYear?: string;
  isClosestMatch?: boolean;
  availableYears?: string[];
  availableTerms?: string[];
  error?: string;
}> {
  const cleanCode = courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const currentYear = new Date().getFullYear().toString();
  let targetYear = requestedYear || currentYear;

  const searchUrl = `https://courseoutlines.unsw.edu.au/v1/publicsitecourseoutlines/search?searchText=${cleanCode}&year=${targetYear}`;

  let searchRes: Response;
  try {
    searchRes = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
  } catch (err: any) {
    return { outline: null, error: `Failed to reach UNSW Course Outlines API: ${err.message}` };
  }

  if (!searchRes.ok) {
    return { outline: null, error: `UNSW Course Outline API returned HTTP ${searchRes.status}` };
  }

  const searchData = await searchRes.json();
  const facets = searchData.response?.facets || [];
  const yearFacet = facets.find((f: any) => f.name === "Year");
  const availableYears: string[] = yearFacet ? yearFacet.allValues.map((v: any) => v.label) : [];

  const results: any[] = searchData.response?.results || [];
  let matches = results.filter((r: any) => r.integrat_coursecode?.toUpperCase() === cleanCode);

  let isClosestMatch = false;
  let closestYear: string | undefined = undefined;

  // If no match in requested year, find closest available year
  if (matches.length === 0 && availableYears.length > 0) {
    for (const yr of availableYears) {
      if (yr === targetYear) continue;
      try {
        const fallbackRes = await fetch(
          `https://courseoutlines.unsw.edu.au/v1/publicsitecourseoutlines/search?searchText=${cleanCode}&year=${yr}`,
          { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const fbResults: any[] = fallbackData.response?.results || [];
          const fbMatches = fbResults.filter((r: any) => r.integrat_coursecode?.toUpperCase() === cleanCode);
          if (fbMatches.length > 0) {
            matches = fbMatches;
            closestYear = yr;
            isClosestMatch = true;
            targetYear = yr;
            break;
          }
        }
      } catch {}
    }
  }

  if (matches.length === 0) {
    return {
      outline: null,
      availableYears,
      availableTerms: [],
      error: `No published UNSW Course Outline found for ${cleanCode} in ${requestedYear || currentYear}.`
    };
  }

  // Extract all existing terms for this course in this year
  const availableTerms: string[] = Array.from(
    new Set(
      matches
        .map((m: any) => m.integrat_term || m.integrat_teachingperiod)
        .filter(Boolean)
    )
  );

  // Filter by term if specified
  let selected = matches[0];
  if (requestedTerm) {
    const cleanTerm = requestedTerm.toLowerCase();
    const termMatch = matches.find((m: any) => {
      const termName = (m.integrat_term || "").toLowerCase();
      const teachingPeriod = (m.integrat_teachingperiod || "").toLowerCase();
      return termName.includes(cleanTerm) || teachingPeriod.includes(cleanTerm);
    });
    if (termMatch) selected = termMatch;
  }

  // Fetch full detail
  if (!selected.primaryURL) {
    return { outline: null, error: "Course outline detail URL missing in search result" };
  }

  const detailRes = await fetch(selected.primaryURL, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
  });

  if (!detailRes.ok) {
    return { outline: null, error: `Failed to fetch outline details (HTTP ${detailRes.status})` };
  }

  const detail = await detailRes.json();

  // Parse schedule
  const rawSchedule: any[] = Array.isArray(detail.integrat_CO_Schedule) ? detail.integrat_CO_Schedule : [];
  const schedule = rawSchedule.map((entry: any) => {
    const weekInfo = parseWeekString(entry.integrat_teachingweek || "");
    const cleanText = stripHtml(entry.integrat_content || "");
    const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
    const topic = lines[0] || `${entry.integrat_type || "Lecture"} ${weekInfo.week}`;
    const description = lines.length > 1 ? lines.slice(1).join("\n") : cleanText;

    return {
      week: weekInfo.week,
      weekLabel: weekInfo.weekLabel,
      type: entry.integrat_type || "Lecture",
      topic: topic.replace(/\.$/, "").trim(),
      description: description.trim(),
      dateRange: weekInfo.dateRange
    };
  });

  // Parse assessments
  const rawAssessments: any[] = Array.isArray(detail.integrat_CO_Assessment) ? detail.integrat_CO_Assessment : [];
  const assessments = rawAssessments.map((a: any) => ({
    title: a.integrat_assessmentname || a.integrat_title || "Assessment",
    type: a.integrat_assessmenttype,
    weight: a.integrat_weight ? `${a.integrat_weight}%` : undefined,
    dueDate: a.integrat_duedatestring || a.integrat_duedate,
    description: stripHtml(a.integrat_assessmentdescription || "")
  }));

  // Parse learning outcomes
  const rawLOs: any[] = Array.isArray(detail.integrat_CO_LearningOutcome) ? detail.integrat_CO_LearningOutcome : [];
  const learningOutcomes = rawLOs.map((lo: any, idx: number) => ({
    code: lo.integrat_locode || `CLO${idx + 1}`,
    description: stripHtml(lo.integrat_description || lo.integrat_lodescription || "")
  }));

  const outline: UNSWCourseOutline = {
    courseCode: cleanCode,
    courseName: detail.integrat_coursename || selected.integrat_coursename || cleanCode,
    year: targetYear,
    term: detail.integrat_term || selected.integrat_term || "Term 1",
    teachingPeriod: detail.integrat_teachingperiod || selected.integrat_teachingperiod,
    coid: selected.integrat_courseoutlineid || detail.integrat_courseoutlineid,
    school: detail.integrat_owningacademicunit,
    faculty: detail.integrat_owningfaculty,
    unitsOfCredit: detail.integrat_unitsofcredit || "6",
    courseSummary: stripHtml(detail.integrat_coursesummary || ""),
    courseAims: stripHtml(detail.integrat_courseaims || ""),
    handbookLink: detail.integrat_handbooklink,
    timetableLink: detail.integrat_timetablelink,
    deliveryMode: detail.integrat_deliverymode,
    deliveryFormat: detail.integrat_deliveryformat,
    schedule,
    assessments,
    learningOutcomes,
    lastUpdated: new Date().toISOString()
  };

  return {
    outline,
    closestYear,
    isClosestMatch,
    availableYears: availableYears.length > 0 ? availableYears : [targetYear],
    availableTerms: availableTerms.length > 0 ? availableTerms : [outline.term]
  };
}

// GET: Fetch course outline
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode") || "math3701";
    const year = searchParams.get("year") || undefined;
    const term = searchParams.get("term") || undefined;
    const refresh = searchParams.get("refresh") === "true";

    const cleanCourse = courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseDir = path.join(COURSES_BASE_DIR, cleanCourse);
    const localOutlinePath = path.join(courseDir, "course_outline.json");

    // Check local cache if refresh not requested
    if (!refresh) {
      try {
        const raw = await fs.readFile(localOutlinePath, "utf-8");
        const cached: UNSWCourseOutline = JSON.parse(raw);
        if (!year || cached.year === year) {
          return NextResponse.json({
            success: true,
            cached: true,
            outline: cached,
            availableYears: [cached.year],
            availableTerms: [cached.term]
          });
        }
      } catch {}
    }

    // Query official UNSW API
    const result = await fetchUNSWCourseOutline(cleanCourse, year, term);
    if (!result.outline) {
      return NextResponse.json(
        {
          error: result.error || "Course outline not found",
          availableYears: result.availableYears,
          availableTerms: result.availableTerms
        },
        { status: 404 }
      );
    }

    // Persist to local course folder
    await fs.mkdir(courseDir, { recursive: true });
    await fs.writeFile(localOutlinePath, JSON.stringify(result.outline, null, 2), "utf-8");

    // Update course.json weeklySyllabus
    try {
      const configPath = path.join(courseDir, "course.json");
      const configRaw = await fs.readFile(configPath, "utf-8");
      const config: CourseMeta = JSON.parse(configRaw);

      // Extract weekly lecture topics for course.json
      const lectureSchedule = result.outline.schedule.filter((s) => s.type === "Lecture");
      const weeklySyllabus = lectureSchedule.map((s) => ({
        week: s.week,
        weekLabel: s.weekLabel,
        topic: s.topic,
        description: s.description,
        dates: s.dateRange
      }));

      config.weeklySyllabus = weeklySyllabus;
      config.name = result.outline.courseName || config.name;
      config.term = `${result.outline.teachingPeriod || result.outline.term}, ${result.outline.year}`;
      if (result.outline.courseSummary) {
        config.description = result.outline.courseSummary.slice(0, 300);
      }

      await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    } catch (confErr) {
      console.warn("Could not update course.json with weeklySyllabus:", confErr);
    }

    return NextResponse.json({
      success: true,
      outline: result.outline,
      isClosestMatch: result.isClosestMatch,
      closestYear: result.closestYear,
      availableYears: result.availableYears,
      availableTerms: result.availableTerms
    });
  } catch (err: any) {
    console.error("Error in /api/courses/outline GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Save custom outline or update Echo360 section URL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseCode, outline, echo360SectionUrl } = body;

    if (!courseCode) {
      return NextResponse.json({ error: "courseCode is required" }, { status: 400 });
    }

    const cleanCourse = courseCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const courseDir = path.join(COURSES_BASE_DIR, cleanCourse);
    await fs.mkdir(courseDir, { recursive: true });

    // Update course.json if echo360SectionUrl is provided
    const configPath = path.join(courseDir, "course.json");
    let config: CourseMeta = {
      id: cleanCourse.toLowerCase(),
      code: cleanCourse,
      name: cleanCourse
    };

    try {
      const configRaw = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(configRaw);
    } catch {}

    if (echo360SectionUrl !== undefined) {
      config.echo360SectionUrl = echo360SectionUrl;
    }

    if (outline) {
      const localOutlinePath = path.join(courseDir, "course_outline.json");
      await fs.writeFile(localOutlinePath, JSON.stringify(outline, null, 2), "utf-8");

      if (Array.isArray(outline.schedule)) {
        config.weeklySyllabus = outline.schedule.map((s: any) => ({
          week: s.week,
          weekLabel: s.weekLabel,
          topic: s.topic,
          description: s.description,
          dates: s.dateRange
        }));
      }
    }

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `Updated course configuration for ${cleanCourse}`,
      config
    });
  } catch (err: any) {
    console.error("Error in /api/courses/outline POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
