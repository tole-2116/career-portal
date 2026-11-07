import { db } from "@career-portal/database";
import { readLocalized } from "./base.service";

const ACTIVITY_LIMIT = 4;

type ActivityEvent = {
  type: "job" | "application";
  at: string;
  text: { vi: string; en: string };
};

export class AdminActivityService {
  async findRecent() {
    const [jobs, candidates] = await Promise.all([
      db.job.findMany({
        where: { isdelete: false },
        orderBy: [{ posted: "desc" }, { id: "asc" }],
        take: ACTIVITY_LIMIT,
        select: { id: true, title: true, posted: true },
      }),
      db.candidate.findMany({
        where: { isdelete: false },
        orderBy: [{ appliedAt: "desc" }, { id: "asc" }],
        take: ACTIVITY_LIMIT,
        select: { id: true, name: true, appliedAt: true, job: { select: { title: true } } },
      }),
    ]);

    const events: ActivityEvent[] = [
      ...jobs.map((job): ActivityEvent => {
        const title = readLocalized(job.title);
        return {
          type: "job",
          at: job.posted.toISOString(),
          text: {
            vi: `Tin tuyển dụng “${title.vi || title.en || ""}” được tạo`,
            en: `Job posting “${title.en || title.vi || ""}” was created`,
          },
        };
      }),
      ...candidates.map((candidate): ActivityEvent => {
        const jobTitle = readLocalized(candidate.job?.title);
        return {
          type: "application",
          at: candidate.appliedAt.toISOString(),
          text: {
            vi: jobTitle.vi || jobTitle.en
              ? `${candidate.name} đã nộp hồ sơ cho vị trí ${jobTitle.vi || jobTitle.en}`
              : `${candidate.name} đã nộp hồ sơ ứng tuyển`,
            en: jobTitle.en || jobTitle.vi
              ? `${candidate.name} applied for ${jobTitle.en || jobTitle.vi}`
              : `${candidate.name} submitted an application`,
          },
        };
      }),
    ];

    return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.type.localeCompare(b.type)).slice(0, ACTIVITY_LIMIT);
  }
}

export const adminActivityService = new AdminActivityService();
