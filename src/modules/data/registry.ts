import type { Model } from "mongoose";
import { ProfileModel, XpEventModel } from "@/modules/gamification/models";
import { TaskModel } from "@/modules/tasks/models";
import { HabitModel, HabitLogModel } from "@/modules/habits/models";
import { QuestBoardModel } from "@/modules/quests/models";
import { BossBattleModel } from "@/modules/boss/models";
import { JournalEntryModel } from "@/modules/journal/models";
import { MoodEntryModel } from "@/modules/mood/models";
import { TimelineEventModel } from "@/modules/timeline/models";
import { MemoryModel } from "@/modules/memory/models";
import { ChatMessageModel, ReviewModel } from "@/modules/ai/models";
import { TransactionModel } from "@/modules/finance/models";
import { FitnessDayModel, WorkoutModel } from "@/modules/fitness/models";
import { CodingProblemModel } from "@/modules/coding/models";
import { InterviewTopicModel } from "@/modules/interview/models";
import { ProjectModel } from "@/modules/projects/models";
import { NoteModel } from "@/modules/notes/models";
import { KnowledgeEntryModel } from "@/modules/knowledge/models";
import { BookmarkModel } from "@/modules/bookmarks/models";
import { LearningItemModel } from "@/modules/learning/models";
import { BookModel } from "@/modules/reading/models";
import { RoadmapModel } from "@/modules/roadmaps/models";
import { VisionItemModel } from "@/modules/vision/models";
import { UserSettingsModel } from "@/modules/settings/models";

/**
 * Every user-scoped collection, for export and account deletion. When a new
 * module adds a `userId`-scoped model, register it here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const USER_MODELS: { name: string; model: Model<any> }[] = [
  { name: "profile", model: ProfileModel },
  { name: "xpEvents", model: XpEventModel },
  { name: "tasks", model: TaskModel },
  { name: "habits", model: HabitModel },
  { name: "habitLogs", model: HabitLogModel },
  { name: "questBoards", model: QuestBoardModel },
  { name: "bossBattles", model: BossBattleModel },
  { name: "journal", model: JournalEntryModel },
  { name: "mood", model: MoodEntryModel },
  { name: "timeline", model: TimelineEventModel },
  { name: "memories", model: MemoryModel },
  { name: "chatMessages", model: ChatMessageModel },
  { name: "reviews", model: ReviewModel },
  { name: "transactions", model: TransactionModel },
  { name: "fitnessDays", model: FitnessDayModel },
  { name: "workouts", model: WorkoutModel },
  { name: "codingProblems", model: CodingProblemModel },
  { name: "interviewTopics", model: InterviewTopicModel },
  { name: "projects", model: ProjectModel },
  { name: "notes", model: NoteModel },
  { name: "knowledge", model: KnowledgeEntryModel },
  { name: "bookmarks", model: BookmarkModel },
  { name: "learning", model: LearningItemModel },
  { name: "books", model: BookModel },
  { name: "roadmaps", model: RoadmapModel },
  { name: "vision", model: VisionItemModel },
  { name: "settings", model: UserSettingsModel },
];
