import "dotenv/config";
import prisma from "../src/lib/prisma.js";

async function main() {
    const instructorEmail = "khanhhuyen3000305@gmail.com";

    const user = await prisma.users.findFirst({
        where: {
            Email: instructorEmail,
        },
        select: {
            Id: true,
            Email: true,
            FullName: true,
            Role: true,
            InstructorId: true,
        },
    });

    if (!user) {
        throw new Error("Instructor user not found");
    }

    if (String(user.Role || "").toLowerCase() !== "instructor") {
        throw new Error("Selected user is not an instructor");
    }

    if (!user.InstructorId) {
        // Try to find InstructorId from Instructors table directly
        let instructorRecord = await prisma.instructors.findFirst({
            where: { CreatorId: user.Id },
            select: { Id: true },
        });
        if (!instructorRecord) {
            // Auto-create Instructor record
            instructorRecord = await prisma.instructors.create({
                data: {
                    CreatorId: user.Id,
                    Intro: "",
                    Experience: "",
                    Balance: 0,
                    CourseCount: 0,
                },
                select: { Id: true },
            });
            // Also update Users.InstructorId
            await prisma.users.update({
                where: { Id: user.Id },
                data: { InstructorId: instructorRecord.Id },
            });
            console.log("✅ Created Instructor record:", instructorRecord.Id);
        }
        user.InstructorId = instructorRecord.Id;
        console.log("Found InstructorId:", user.InstructorId);
    }

    const leafCategory = await prisma.categories.findFirst({
        where: {
            IsLeaf: true,
        },
        select: {
            Id: true,
            Title: true,
        },
    });

    if (!leafCategory) {
        throw new Error("No leaf category found");
    }

    const existingCourse = await prisma.courses.findFirst({
        where: {
            CreatorId: user.Id,
            Title: "Question Bank Test Course",
        },
        select: {
            Id: true,
            Title: true,
        },
    });

    if (existingCourse) {
        console.log("Test course already exists:", existingCourse);
        return;
    }

    const course = await prisma.courses.create({
        data: {
            Title: "Question Bank Test Course",
            MetaTitle: "Question Bank Test Course",
            ThumbUrl: "",
            Intro: "Test course for question bank module",
            Description: "This course is only used to test question bank creation flow.",
            Status: "Draft",
            Price: 0,
            Discount: 0,
            DiscountExpiry: new Date(),
            Level: "Beginner",
            Outcomes: "",
            Requirements: "",
            LectureCount: 0,
            LearnerCount: 0,
            RatingCount: 0,
            TotalRating: 0,
            LeafCategoryId: leafCategory.Id,
            InstructorId: user.InstructorId,
            CreatorId: user.Id,
            LastModifierId: user.Id,
            ApprovalStatus: "Pending",
        },
        select: {
            Id: true,
            Title: true,
            CreatorId: true,
            InstructorId: true,
        },
    });

    console.log("Created test course:", course);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });