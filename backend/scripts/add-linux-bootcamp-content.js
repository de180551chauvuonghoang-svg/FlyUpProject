import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Sample video URLs for demonstration
const sampleVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerFun.mp4",
];

// Comprehensive lecture content for each section
const sectionContent = {
  "Overview": [
    { title: "Welcome to the Course", content: "Introduction to Linux Administration Bootcamp and what you'll learn", duration: "5:30" },
    { title: "Course Overview and Objectives", content: "Detailed overview of course structure and learning objectives", duration: "8:15" },
    { title: "How to Get the Most Out of This Course", content: "Tips and strategies for successful learning", duration: "6:45" },
  ],
  "Installing and Connecting to a Linux System": [
    { title: "Linux Distribution Overview", content: "Understanding different Linux distributions (Ubuntu, CentOS, RedHat)", duration: "10:20" },
    { title: "Installing Linux - VirtualBox Setup", content: "Step-by-step guide to installing Linux using VirtualBox", duration: "15:40" },
    { title: "Installing Linux - VMware Setup", content: "Alternative installation using VMware", duration: "12:30" },
    { title: "Connecting via SSH", content: "Learn how to connect to Linux systems using SSH", duration: "9:15" },
    { title: "SSH Key Authentication", content: "Setting up secure SSH key-based authentication", duration: "11:45" },
  ],
  "Linux Fundamentals": [
    { title: "The Linux Directory Structure", content: "Understanding the filesystem hierarchy standard (FHS)", duration: "12:20" },
    { title: "Basic Linux Commands", content: "Essential commands: ls, cd, pwd, mkdir, rm, cp, mv", duration: "18:30" },
    { title: "Working with Files and Directories", content: "Creating, moving, copying, and deleting files and directories", duration: "15:45" },
    { title: "Viewing File Contents", content: "Using cat, less, more, head, tail commands", duration: "10:25" },
    { title: "Text Editors - Nano and Vi", content: "Introduction to Linux text editors", duration: "14:50" },
    { title: "Finding Files and Directories", content: "Using find and locate commands", duration: "13:15" },
    { title: "File Permissions - Part 1", content: "Understanding Linux file permissions (rwx)", duration: "16:30" },
    { title: "File Permissions - Part 2", content: "Changing permissions with chmod", duration: "12:40" },
  ],
  "Intermediate Linux Skills": [
    { title: "Environment Variables", content: "Understanding and setting environment variables", duration: "11:20" },
    { title: "Processes and Jobs", content: "Managing processes with ps, top, kill commands", duration: "14:35" },
    { title: "Scheduling Jobs with Cron", content: "Automating tasks using cron and crontab", duration: "16:45" },
    { title: "Package Management - APT", content: "Managing packages on Debian/Ubuntu systems", duration: "13:50" },
    { title: "Package Management - YUM/DNF", content: "Managing packages on RedHat/CentOS systems", duration: "12:25" },
    { title: "Archives and Compression", content: "Working with tar, gzip, bzip2", duration: "10:40" },
  ],
  "The Linux Boot Process and System Logging": [
    { title: "Understanding the Boot Process", content: "BIOS, GRUB, kernel initialization, and systemd", duration: "15:20" },
    { title: "Runlevels and Targets", content: "Understanding system runlevels and systemd targets", duration: "12:30" },
    { title: "System Logging with Syslog", content: "Understanding system logs and syslog", duration: "13:45" },
    { title: "Journalctl and Systemd Logs", content: "Working with systemd journal logs", duration: "14:15" },
  ],
  "Disk Management": [
    { title: "Disk Partitioning Concepts", content: "Understanding disk partitions, MBR vs GPT", duration: "12:50" },
    { title: "Creating Partitions with fdisk", content: "Hands-on disk partitioning with fdisk", duration: "16:30" },
    { title: "Creating Filesystems", content: "Creating ext4, xfs, and other filesystems", duration: "13:20" },
    { title: "Mounting Filesystems", content: "Mounting and unmounting filesystems", duration: "11:45" },
    { title: "The /etc/fstab File", content: "Configuring automatic mounting at boot", duration: "14:10" },
  ],
  "LVM - The Logical Volume Manager": [
    { title: "LVM Concepts and Architecture", content: "Understanding Physical Volumes, Volume Groups, and Logical Volumes", duration: "15:40" },
    { title: "Creating LVM Volumes", content: "Step-by-step LVM setup", duration: "18:25" },
    { title: "Expanding LVM Volumes", content: "Extending volume groups and logical volumes", duration: "14:50" },
    { title: "LVM Snapshots", content: "Creating and managing LVM snapshots", duration: "13:35" },
  ],
  "User Management": [
    { title: "Users and Groups Concepts", content: "Understanding Linux users and groups", duration: "10:45" },
    { title: "Creating and Managing Users", content: "useradd, usermod, userdel commands", duration: "15:20" },
    { title: "Creating and Managing Groups", content: "groupadd, groupmod, groupdel commands", duration: "12:30" },
    { title: "Password Management", content: "passwd, chage commands, password policies", duration: "13:50" },
    { title: "Sudo and Sudoers", content: "Configuring sudo access and sudoers file", duration: "16:15" },
  ],
  "Networking": [
    { title: "Network Fundamentals", content: "IP addresses, subnets, and network interfaces", duration: "14:30" },
    { title: "Network Configuration", content: "Configuring network interfaces", duration: "15:45" },
    { title: "Network Troubleshooting Tools", content: "ping, traceroute, netstat, ss commands", duration: "13:20" },
    { title: "Firewall Configuration - iptables", content: "Introduction to iptables firewall", duration: "17:40" },
    { title: "Firewall Configuration - firewalld", content: "Working with firewalld on modern systems", duration: "15:25" },
  ],
  "Advanced Linux Permissions": [
    { title: "Special Permissions - SetUID", content: "Understanding and using SetUID permission", duration: "12:40" },
    { title: "Special Permissions - SetGID", content: "Understanding and using SetGID permission", duration: "11:55" },
    { title: "Special Permissions - Sticky Bit", content: "Understanding and using the Sticky Bit", duration: "10:30" },
    { title: "Access Control Lists (ACLs)", content: "Advanced permissions with ACLs", duration: "16:20" },
  ],
  "Shell Scripting": [
    { title: "Introduction to Shell Scripting", content: "Basics of bash shell scripting", duration: "12:45" },
    { title: "Variables and Data Types", content: "Working with variables in shell scripts", duration: "14:30" },
    { title: "Conditional Statements", content: "if, else, elif statements in bash", duration: "15:20" },
    { title: "Loops in Bash", content: "for, while, until loops", duration: "16:40" },
    { title: "Functions in Bash", content: "Creating and using functions", duration: "13:25" },
    { title: "Script Parameters and Arguments", content: "Working with command-line arguments", duration: "12:15" },
    { title: "Practical Scripting Examples", content: "Real-world shell scripting examples", duration: "18:50" },
  ],
  "Advanced Command Line Skills - Command Line Kung Fu": [
    { title: "Advanced grep Techniques", content: "Mastering grep with regular expressions", duration: "14:45" },
    { title: "Text Processing with sed", content: "Stream editing with sed", duration: "16:30" },
    { title: "Text Processing with awk", content: "Pattern scanning and processing with awk", duration: "17:20" },
    { title: "Command Line Productivity Tips", content: "Aliases, history, shortcuts, and more", duration: "13:40" },
  ],
  "Extras": [
    { title: "Monitoring System Resources", content: "Using top, htop, vmstat, iostat", duration: "14:25" },
    { title: "System Performance Tuning", content: "Basic performance optimization techniques", duration: "15:50" },
    { title: "Backup and Restore Strategies", content: "Best practices for system backups", duration: "16:35" },
  ],
  "Summary": [
    { title: "Course Recap", content: "Summary of everything you've learned", duration: "10:20" },
    { title: "Next Steps in Your Linux Journey", content: "Resources and recommendations for continued learning", duration: "8:45" },
  ],
  "Course Slides": [
    { title: "Downloadable Course Slides", content: "Access to all course presentation slides", duration: "2:00" },
  ],
  "Bonus Section": [
    { title: "Bonus Content and Resources", content: "Additional materials and resources", duration: "12:30" },
    { title: "Career Advice for Linux Administrators", content: "Tips for building a career in Linux administration", duration: "15:20" },
  ],
};

async function main() {
  console.log("--- Adding Lectures and Materials to Linux Bootcamp ---\n");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";

  // Get all sections for this course
  const sections = await prisma.sections.findMany({
    where: { CourseId: courseId },
    orderBy: { Index: "asc" },
  });

  console.log(`Found ${sections.length} sections\n`);

  let totalLectures = 0;
  let totalMaterials = 0;
  let videoIndex = 0;

  for (const section of sections) {
    const sectionTitle = section.Title;
    const lectures = sectionContent[sectionTitle];

    if (!lectures || lectures.length === 0) {
      console.log(`⚠️  No content defined for section: ${sectionTitle}`);
      continue;
    }

    console.log(`📂 Processing section: ${sectionTitle}`);
    console.log(`   Adding ${lectures.length} lectures...`);

    for (let i = 0; i < lectures.length; i++) {
      const lectureData = lectures[i];
      const lectureId = uuidv4();

      // Create lecture
      const lecture = await prisma.lectures.create({
        data: {
          Id: lectureId,
          Title: lectureData.title,
          Content: lectureData.content,
          SectionId: section.Id,
          CreationTime: new Date(),
          LastModificationTime: new Date(),
          IsPreviewable: i === 0, // First lecture in each section is previewable
        },
      });

      totalLectures++;

      // Add video material
      const videoUrl = sampleVideos[videoIndex % sampleVideos.length];
      await prisma.lectureMaterial.create({
        data: {
          LectureId: lectureId,
          Type: "video",
          Url: videoUrl,
        },
      });

      totalMaterials++;
      videoIndex++;

      console.log(`   ✓ ${lectureData.title} (${lectureData.duration})`);
    }

    // Update section lecture count
    await prisma.sections.update({
      where: { Id: section.Id },
      data: { LectureCount: lectures.length },
    });

    console.log(`   ✅ Added ${lectures.length} lectures to ${sectionTitle}\n`);
  }

  // Update course lecture count
  await prisma.courses.update({
    where: { Id: courseId },
    data: { LectureCount: totalLectures },
  });

  console.log(`\n🎉 Successfully completed!`);
  console.log(`📊 Summary:`);
  console.log(`   Total Lectures Created: ${totalLectures}`);
  console.log(`   Total Video Materials: ${totalMaterials}`);
  console.log(`   Course is now ready for learning!`);

  // Verify
  console.log("\n--- Verification ---");
  const updatedCourse = await prisma.courses.findFirst({
    where: { Id: courseId },
    include: {
      Sections: {
        include: {
          Lectures: {
            include: {
              LectureMaterial: true,
            },
          },
        },
        orderBy: { Index: "asc" },
      },
    },
  });

  if (updatedCourse) {
    console.log(`\nCourse: ${updatedCourse.Title}`);
    console.log(`Total Lectures: ${updatedCourse.LectureCount}`);
    
    let verifyLectures = 0;
    let verifyMaterials = 0;
    
    updatedCourse.Sections.forEach((sec) => {
      verifyLectures += sec.Lectures?.length || 0;
      sec.Lectures?.forEach((lec) => {
        verifyMaterials += lec.LectureMaterial?.length || 0;
      });
    });
    
    console.log(`Verified Lectures: ${verifyLectures}`);
    console.log(`Verified Materials: ${verifyMaterials}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
