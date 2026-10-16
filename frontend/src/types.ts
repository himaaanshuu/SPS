export interface StudentProfile {
  cgpa: number; tenth_pct: number; twelfth_pct: number; backlogs: number;
  coding_score: number; dsa_proficiency: number; projects: number; certifications: number;
  quant_aptitude: number; logical_reasoning: number; verbal_ability: number;
  communication: number; internship_months: number; interview_readiness: number;
  extracurricular: number; department: string; semester: number;
}

export interface PredictResult {
  placement_probability: number;
  placement_status: "LIKELY TO BE PLACED" | "BORDERLINE" | "NEEDS WORK";
  confidence: string;
  readiness_score: number;
  readiness_band: string;
  breakdown: Record<string, number>;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  fuzzy_explanation: { memberships: Record<string, Record<string, number>>; activated_rules: ActivatedRule[]; fuzzy_score: number };
  model_used: string;
}

export interface ActivatedRule {
  rule_id: string;
  antecedent: Record<string, string>;
  consequent: string;
  firing_strength: number;
}

export const DEFAULT_PROFILE: StudentProfile = {
  cgpa: 8.2, tenth_pct: 88, twelfth_pct: 84, backlogs: 0,
  coding_score: 74, dsa_proficiency: 62, projects: 3, certifications: 2,
  quant_aptitude: 78, logical_reasoning: 72, verbal_ability: 76,
  communication: 71, internship_months: 4, interview_readiness: 68,
  extracurricular: 55, department: "CSE", semester: 6,
};
