## II. Code Designs
### 5. Feature: User Engagement (Wishlist, Comments, Ratings & Reviews)
*This part provides the detailed design for the User Engagement functions, including managing the wishlist, participating in lesson discussions, and rating courses.*

---

#### 5.1. WishList (Add / Remove / View)
*This function allows learners to save courses for future reference and manage their saved list.*

**a. Class Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
classDiagram
    class WishlistController {
        +getWishlist(req, res)
        +toggleWishlist(req, res)
        +checkWishlistStatus(req, res)
    }

    class Wishlist {
        +UserId: UUID
        +CourseId: UUID
        +CreationTime: DateTime
    }
    
    class Courses {
        +Id: UUID
        +Title: String
        +Price: Float
        +ThumbUrl: String
    }

    WishlistController --> Wishlist
    WishlistController --> Courses : Includes nested data
```

**b. Class Specifications**
| Class | Method | Description |
|---|---|---|
| `WishlistController` | `getWishlist` | Retrieves a list of all courses the currently authenticated user has added to their wishlist, eager-loading basic course details. |
| `WishlistController` | `toggleWishlist` | Checks if a specific course is already in the user's wishlist; if so, it removes it, otherwise it adds it. Returns the new boolean status. |
| `WishlistController` | `checkWishlistStatus` | Checks whether a specific course is currently in the authenticated user's wishlist. Returns a boolean status. |

**c. Sequence Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    actor Client
    participant WishlistRouter
    participant WishlistController
    participant PrismaDB

    Client->>WishlistRouter: POST /wishlist/toggle {courseId}
    WishlistRouter->>WishlistController: toggleWishlist(req, res)
    WishlistController->>PrismaDB: Wishlist.findUnique(UserId, CourseId)
    PrismaDB-->>WishlistController: Existing Record (null | object)
    
    alt Exists
        WishlistController->>PrismaDB: Wishlist.delete(UserId_CourseId)
        PrismaDB-->>WishlistController: Success
        WishlistController-->>Client: 200 OK { isInWishlist: false }
    else Does Not Exist
        WishlistController->>PrismaDB: Wishlist.create(UserId, CourseId)
        PrismaDB-->>WishlistController: Success
        WishlistController-->>Client: 201 Created { isInWishlist: true }
    end
```

**d. Prisma ORM Queries**
```javascript
// Toggle Wishlist Logic
const existing = await prisma.wishlist.findUnique({
    where: { UserId_CourseId: { UserId: userId, CourseId: courseId } }
});

if (existing) {
    await prisma.wishlist.delete({
        where: { UserId_CourseId: { UserId: userId, CourseId: courseId } }
    });
} else {
    await prisma.wishlist.create({
        data: { UserId: userId, CourseId: courseId }
    });
}

// Get Wishlist
const wishlist = await prisma.wishlist.findMany({
    where: { UserId: userId },
    include: {
        Courses: {
            include: { Instructors: { /*...*/ }, Categories: { /*...*/ } }
        }
    },
    orderBy: { CreationTime: 'desc' }
});
```

---

#### 5.2. Comments & Discussions
*This function acts as a Q&A or discussion board attached to specific Lectures or Articles.*

**a. Class Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
classDiagram
    class CommentController {
        +addComment(req, res)
        +getComments(req, res)
    }

    class CommentService {
        +createComment(userId, data)
        +getComments(type, id, page, limit)
    }

    class Comments {
        +Id: UUID
        +Content: String
        +SourceType: String
        +LectureId: UUID
        +ArticleId: UUID
        +ParentId: UUID
    }

    class CommentMedia {
        +Id: Int
        +CommentId: UUID
        +Type: String
        +Url: String
    }

    CommentController --> CommentService
    CommentService --> Comments
    CommentService --> CommentMedia
```

**b. Class Specifications**
| Class | Method | Description |
|---|---|---|
| `CommentController` | `addComment` | Validates payload constraints and passes content, source references, and optional media arrays to `CommentService`. |
| `CommentService` | `createComment` | Executes a Prisma `$transaction` to ensure `Comments` and its nested `CommentMedia` records are securely created together. Handles routing logic based on `sourceType` (Lecture/Article). |
| `CommentService` | `getComments` | Retrieves a paginated list of root-level comments along with their 1st-level child `replies` (using self-referencing relationship) and media attachments. |

**c. Sequence Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    actor Client
    participant CommentRouter
    participant CommentController
    participant CommentService
    participant PrismaDB

    Client->>CommentRouter: GET /comments?sourceType=Lecture&sourceId=123
    CommentRouter->>CommentController: getComments(req, res)
    CommentController->>CommentService: getComments('Lecture', '123', 1, 20)
    
    CommentService->>PrismaDB: Comments.findMany(where ParentId == null) { include replies, media, users }
    PrismaDB-->>CommentService: Array of Nested Comments
    
    CommentService->>PrismaDB: Comments.count(where ParentId == null)
    PrismaDB-->>CommentService: Total Root Comments
    
    CommentService->>CommentService: Format pagination DTO
    CommentService-->>CommentController: { comments, pagination }
    CommentController-->>Client: 200 OK
```

**d. Prisma ORM Queries**
```javascript
// Add Comment with Media Transaction
await prisma.$transaction(async (tx) => {
    const comment = await tx.comments.create({
        data: {
            Content: content,
            CreatorId: userId,
            SourceType: 'Lecture',
            LectureId: sourceId,
            ParentId: parentId || null
        }
    });

    if (media?.length > 0) {
        await tx.commentMedia.createMany({
            data: media.map(m => ({
                CommentId: comment.Id,
                Type: m.type,
                Url: m.url
            }))
        });
    }
    return comment;
});

// Get Nested Comments
const comments = await prisma.comments.findMany({
    where: { 
        LectureId: sourceId, 
        ParentId: null // Root level only
    },
    include: {
        Users: { select: { FullName: true, AvatarUrl: true } },
        CommentMedia: true,
        other_Comments: { // Replies relationship
            include: {
                Users: { select: { FullName: true, AvatarUrl: true } },
                CommentMedia: true
            },
            orderBy: { CreationTime: 'asc' }
        }
    },
    orderBy: { CreationTime: 'desc' },
    skip: 0,
    take: 20
});
```

---

#### 5.3. Course Reviews & Ratings
*This function allows students to rate a course and provide feedback, exclusively available to enrolled learners.*

**a. Class Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
classDiagram
    class CourseController {
        +addReview(req, res)
        +getReviews(req, res)
    }

    class ReviewService {
        +createReview(userId, courseId, data)
        +getCourseReviews(courseId, page, limit)
    }

    class CourseReviews {
        +Id: UUID
        +Rating: Int
        +Content: String
    }
    
    class Courses {
        +TotalRating: Float
        +RatingCount: Int
    }
    
    class Enrollments {
        +Status: String
    }

    CourseController --> ReviewService
    ReviewService --> CourseReviews
    ReviewService --> Courses
    ReviewService --> Enrollments : Authorization
```

**b. Class Specifications**
| Class | Method | Description |
|---|---|---|
| `ReviewService` | `createReview` | Confirms the user holds an `Active` `Enrollment`. Checks for an existing review. If updating, incrementally adjusts the `Courses.TotalRating` aggregate. If new, increments `TotalRating` and `RatingCount`. Handled within a single database transaction. |
| `ReviewService` | `getCourseReviews` | Fetches a paginated, chronologically descending list of reviews attached to a specific course, populated with basic user demographic data. |

**c. Sequence Diagram**
```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    actor Learner
    participant CourseRouter
    participant CourseController
    participant ReviewService
    participant PrismaDB

    Learner->>CourseRouter: POST /courses/{id}/reviews {rating: 5, content}
    CourseRouter->>CourseController: addReview(req, res)
    CourseController->>ReviewService: createReview(userId, courseId, data)
    
    %% Authorization Check
    ReviewService->>PrismaDB: Enrollments.findFirst(User, Course, Status: Active)
    PrismaDB-->>ReviewService: Active Enrollment Found
    
    ReviewService->>PrismaDB: start $transaction
    
    ReviewService->>PrismaDB: CourseReviews.findFirst(User, Course)
    PrismaDB-->>ReviewService: existingReview
    
    alt Review Exists
        ReviewService->>PrismaDB: CourseReviews.update(newRating)
        ReviewService->>PrismaDB: Courses.update({ TotalRating: increment(diff) })
    else Review Does Not Exist
        ReviewService->>PrismaDB: CourseReviews.create(newRating)
        ReviewService->>PrismaDB: Courses.update({ TotalRating: increment(val), RatingCount: increment(1) })
    end
    
    PrismaDB-->>ReviewService: Transaction Success
    ReviewService-->>CourseController: Saved Review Object
    CourseController-->>Learner: 201 Created
```

**d. Prisma ORM Queries**
```javascript
// Enforcement of Enrollment Policy
const enrollment = await prisma.enrollments.findFirst({
    where: {
        CreatorId: userId,
        CourseId: courseId,
        Status: 'Active' 
    }
});
if (!enrollment) throw new Error('Unenrolled');

// Transaction block
await prisma.$transaction(async (tx) => {
    // Creating Brand New Review
    const review = await tx.courseReviews.create({
        data: {
            CourseId: courseId,
            CreatorId: userId,
            Rating: ratingInt,
            Content: content 
        }
    });

    // Automatically synchronize course aggregate fields
    await tx.courses.update({
        where: { Id: courseId },
        data: {
            TotalRating: { increment: ratingInt },
            RatingCount: { increment: 1 }
        }
    });
});
```
