import dotenv from 'dotenv';
dotenv.config();
import prisma from "../src/lib/prisma.js";

/**
 * Linux Administration Bootcamp - MCQ Quiz Questions
 * Creates 1 Assignment per Section with up to 10 MCQ questions each
 */

const COURSE_ID = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580';

// Section IDs from the database
const SECTIONS = {
  S1_INSTALLING: '1cf6e6f3-7a68-472c-50b0-08dbd1dd90e7',
  S2_FUNDAMENTALS: 'fef96a0e-4e75-4877-50b1-08dbd1dd90e7',
  S3_INTERMEDIATE: '96fc066a-6b7a-468d-50b2-08dbd1dd90e7',
  S4_BOOT_LOGGING: '5801fa65-26db-4dab-50b3-08dbd1dd90e7',
  S5_DISK: '6cfe9cb2-c22f-4d0d-50b4-08dbd1dd90e7',
  S6_LVM: '148f784a-3f12-4326-50b5-08dbd1dd90e7',
  S7_USER_MGMT: 'a484f4cf-2b81-4b64-50b6-08dbd1dd90e7',
  S8_NETWORKING: '85fcf4fb-ba26-4004-50b7-08dbd1dd90e7',
  S9_ADV_PERMS: '47fe4d6c-a6b8-4cfc-50b8-08dbd1dd90e7',
  S10_SHELL_SCRIPT: 'bdf28473-2568-44b9-50b9-08dbd1dd90e7',
  S11_ADV_CLI: 'ef093639-695e-4b95-50ba-08dbd1dd90e7',
  S12_EXTRAS: 'fdeea5b7-5f42-42b6-50bb-08dbd1dd90e7',
};

// IRT difficulty params: Easy -> ParamB=-1, Medium -> ParamB=0, Hard -> ParamB=1
function getIRTParams(difficulty) {
  switch (difficulty) {
    case 'Easy': return { ParamA: 1.0, ParamB: -1.0, ParamC: 0.25 };
    case 'Medium': return { ParamA: 1.0, ParamB: 0.0, ParamC: 0.25 };
    case 'Hard': return { ParamA: 1.0, ParamB: 1.0, ParamC: 0.25 };
    default: return { ParamA: 1.0, ParamB: 0.0, ParamC: 0.25 };
  }
}

// ==================== QUESTION DATA ====================

const quizData = [
  {
    sectionId: SECTIONS.S1_INSTALLING,
    assignmentName: 'Installing and Connecting to Linux Quiz',
    questions: [
      {
        content: 'Which of the following is a popular Linux distribution based on Debian?',
        difficulty: 'Easy',
        choices: [
          { content: 'Ubuntu', isCorrect: true },
          { content: 'Fedora', isCorrect: false },
          { content: 'CentOS', isCorrect: false },
          { content: 'Arch Linux', isCorrect: false },
        ],
      },
      {
        content: 'What is the default port number used by SSH?',
        difficulty: 'Easy',
        choices: [
          { content: '21', isCorrect: false },
          { content: '22', isCorrect: true },
          { content: '80', isCorrect: false },
          { content: '443', isCorrect: false },
        ],
      },
      {
        content: 'Which command is used to connect to a remote Linux server via SSH?',
        difficulty: 'Easy',
        choices: [
          { content: 'telnet user@host', isCorrect: false },
          { content: 'ssh user@host', isCorrect: true },
          { content: 'ftp user@host', isCorrect: false },
          { content: 'connect user@host', isCorrect: false },
        ],
      },
      {
        content: 'Where are SSH public keys stored on the server for key-based authentication?',
        difficulty: 'Medium',
        choices: [
          { content: '/etc/ssh/keys', isCorrect: false },
          { content: '~/.ssh/authorized_keys', isCorrect: true },
          { content: '~/.ssh/known_hosts', isCorrect: false },
          { content: '/var/ssh/public_keys', isCorrect: false },
        ],
      },
      {
        content: 'Which command generates an SSH key pair?',
        difficulty: 'Medium',
        choices: [
          { content: 'ssh-keygen', isCorrect: true },
          { content: 'ssh-genkey', isCorrect: false },
          { content: 'keygen-ssh', isCorrect: false },
          { content: 'openssl genrsa', isCorrect: false },
        ],
      },
      {
        content: 'What type of hypervisor is VirtualBox?',
        difficulty: 'Medium',
        choices: [
          { content: 'Type 1 (bare-metal)', isCorrect: false },
          { content: 'Type 2 (hosted)', isCorrect: true },
          { content: 'Type 3 (container-based)', isCorrect: false },
          { content: 'Type 0 (embedded)', isCorrect: false },
        ],
      },
      {
        content: 'Which file on the SSH client stores fingerprints of previously connected servers?',
        difficulty: 'Medium',
        choices: [
          { content: '~/.ssh/config', isCorrect: false },
          { content: '~/.ssh/authorized_keys', isCorrect: false },
          { content: '~/.ssh/known_hosts', isCorrect: true },
          { content: '~/.ssh/id_rsa', isCorrect: false },
        ],
      },
      {
        content: 'Which Linux distribution family uses RPM package management?',
        difficulty: 'Easy',
        choices: [
          { content: 'Debian', isCorrect: false },
          { content: 'Red Hat / Fedora', isCorrect: true },
          { content: 'Slackware', isCorrect: false },
          { content: 'Gentoo', isCorrect: false },
        ],
      },
      {
        content: 'What is the purpose of the SSH config file (~/.ssh/config)?',
        difficulty: 'Hard',
        choices: [
          { content: 'To store SSH passwords', isCorrect: false },
          { content: 'To define host aliases, ports, and identity files for SSH connections', isCorrect: true },
          { content: 'To configure the SSH daemon on the server', isCorrect: false },
          { content: 'To log SSH connection attempts', isCorrect: false },
        ],
      },
      {
        content: 'Which SSH option disables password authentication, requiring key-based auth only?',
        difficulty: 'Hard',
        choices: [
          { content: 'PasswordAuthentication no', isCorrect: true },
          { content: 'DisablePassword yes', isCorrect: false },
          { content: 'AuthMode key-only', isCorrect: false },
          { content: 'NoPasswordLogin true', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S2_FUNDAMENTALS,
    assignmentName: 'Linux Fundamentals Quiz',
    questions: [
      {
        content: 'Which directory contains system configuration files in Linux?',
        difficulty: 'Easy',
        choices: [
          { content: '/bin', isCorrect: false },
          { content: '/etc', isCorrect: true },
          { content: '/var', isCorrect: false },
          { content: '/usr', isCorrect: false },
        ],
      },
      {
        content: 'Which command lists all files, including hidden ones?',
        difficulty: 'Easy',
        choices: [
          { content: 'ls -l', isCorrect: false },
          { content: 'ls -a', isCorrect: true },
          { content: 'ls -h', isCorrect: false },
          { content: 'ls -r', isCorrect: false },
        ],
      },
      {
        content: 'What does the command "chmod 755 file.sh" do?',
        difficulty: 'Medium',
        choices: [
          { content: 'Owner: rwx, Group: r-x, Others: r-x', isCorrect: true },
          { content: 'Owner: rwx, Group: rwx, Others: r-x', isCorrect: false },
          { content: 'Owner: rw-, Group: r--, Others: r--', isCorrect: false },
          { content: 'Owner: rwx, Group: rw-, Others: rw-', isCorrect: false },
        ],
      },
      {
        content: 'Which command is used to create a new directory?',
        difficulty: 'Easy',
        choices: [
          { content: 'newdir', isCorrect: false },
          { content: 'mkdir', isCorrect: true },
          { content: 'create', isCorrect: false },
          { content: 'makedir', isCorrect: false },
        ],
      },
      {
        content: 'Which command displays the last 10 lines of a file by default?',
        difficulty: 'Easy',
        choices: [
          { content: 'head', isCorrect: false },
          { content: 'tail', isCorrect: true },
          { content: 'cat', isCorrect: false },
          { content: 'less', isCorrect: false },
        ],
      },
      {
        content: 'In Vi/Vim, which key enters insert mode?',
        difficulty: 'Medium',
        choices: [
          { content: 'i', isCorrect: true },
          { content: 'e', isCorrect: false },
          { content: 'a only works after cursor', isCorrect: false },
          { content: 'Ctrl+I', isCorrect: false },
        ],
      },
      {
        content: 'Which command searches for files by name in a directory tree?',
        difficulty: 'Medium',
        choices: [
          { content: 'search', isCorrect: false },
          { content: 'find', isCorrect: true },
          { content: 'grep', isCorrect: false },
          { content: 'look', isCorrect: false },
        ],
      },
      {
        content: 'What does the "locate" command use to find files quickly?',
        difficulty: 'Medium',
        choices: [
          { content: 'Real-time filesystem scan', isCorrect: false },
          { content: 'A pre-built database (updatedb)', isCorrect: true },
          { content: 'The /proc filesystem', isCorrect: false },
          { content: 'Kernel file cache', isCorrect: false },
        ],
      },
      {
        content: 'What does the permission string "drwxr-x---" indicate?',
        difficulty: 'Hard',
        choices: [
          { content: 'A file with full permissions for everyone', isCorrect: false },
          { content: 'A directory where owner has rwx, group has r-x, others have no access', isCorrect: true },
          { content: 'A directory with read-only access for all', isCorrect: false },
          { content: 'A symbolic link with restricted permissions', isCorrect: false },
        ],
      },
      {
        content: 'Which command recursively changes ownership of all files in a directory?',
        difficulty: 'Hard',
        choices: [
          { content: 'chown user:group dir/', isCorrect: false },
          { content: 'chown -R user:group dir/', isCorrect: true },
          { content: 'chmod -R user:group dir/', isCorrect: false },
          { content: 'own -R user:group dir/', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S3_INTERMEDIATE,
    assignmentName: 'Intermediate Linux Skills Quiz',
    questions: [
      {
        content: 'Which command displays all environment variables?',
        difficulty: 'Easy',
        choices: [
          { content: 'env', isCorrect: true },
          { content: 'vars', isCorrect: false },
          { content: 'show env', isCorrect: false },
          { content: 'list-env', isCorrect: false },
        ],
      },
      {
        content: 'How do you make an environment variable available to child processes?',
        difficulty: 'Medium',
        choices: [
          { content: 'set VAR=value', isCorrect: false },
          { content: 'export VAR=value', isCorrect: true },
          { content: 'declare VAR=value', isCorrect: false },
          { content: 'global VAR=value', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows all running processes with detailed information?',
        difficulty: 'Easy',
        choices: [
          { content: 'ps aux', isCorrect: true },
          { content: 'proc -all', isCorrect: false },
          { content: 'list-proc', isCorrect: false },
          { content: 'showproc', isCorrect: false },
        ],
      },
      {
        content: 'What does the cron expression "0 2 * * *" mean?',
        difficulty: 'Medium',
        choices: [
          { content: 'Every 2 minutes', isCorrect: false },
          { content: 'Every day at 2:00 AM', isCorrect: true },
          { content: 'Every 2nd day of the month', isCorrect: false },
          { content: 'Every February', isCorrect: false },
        ],
      },
      {
        content: 'Which command is used to edit the crontab for the current user?',
        difficulty: 'Easy',
        choices: [
          { content: 'cron edit', isCorrect: false },
          { content: 'crontab -e', isCorrect: true },
          { content: 'vi /etc/crontab', isCorrect: false },
          { content: 'edit-cron', isCorrect: false },
        ],
      },
      {
        content: 'Which command installs a package on Debian/Ubuntu systems?',
        difficulty: 'Easy',
        choices: [
          { content: 'yum install package', isCorrect: false },
          { content: 'apt install package', isCorrect: true },
          { content: 'rpm -i package', isCorrect: false },
          { content: 'pacman -S package', isCorrect: false },
        ],
      },
      {
        content: 'Which package manager is used on Red Hat / CentOS 8+ systems?',
        difficulty: 'Medium',
        choices: [
          { content: 'apt', isCorrect: false },
          { content: 'dnf', isCorrect: true },
          { content: 'pacman', isCorrect: false },
          { content: 'zypper', isCorrect: false },
        ],
      },
      {
        content: 'Which command creates a tar.gz compressed archive of a directory?',
        difficulty: 'Medium',
        choices: [
          { content: 'tar -czf archive.tar.gz directory/', isCorrect: true },
          { content: 'zip -r archive.tar.gz directory/', isCorrect: false },
          { content: 'gzip directory/ > archive.tar.gz', isCorrect: false },
          { content: 'compress -tar directory/', isCorrect: false },
        ],
      },
      {
        content: 'How do you send a running process to the background?',
        difficulty: 'Hard',
        choices: [
          { content: 'Press Ctrl+C then type bg', isCorrect: false },
          { content: 'Press Ctrl+Z then type bg', isCorrect: true },
          { content: 'Type background PID', isCorrect: false },
          { content: 'Press Ctrl+B', isCorrect: false },
        ],
      },
      {
        content: 'What is the difference between "kill" and "kill -9"?',
        difficulty: 'Hard',
        choices: [
          { content: 'kill sends SIGTERM (graceful), kill -9 sends SIGKILL (forced)', isCorrect: true },
          { content: 'kill stops a process, kill -9 restarts it', isCorrect: false },
          { content: 'Both do the same thing', isCorrect: false },
          { content: 'kill -9 is gentler than kill', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S4_BOOT_LOGGING,
    assignmentName: 'Boot Process and System Logging Quiz',
    questions: [
      {
        content: 'What is the first process started by the Linux kernel during boot?',
        difficulty: 'Medium',
        choices: [
          { content: 'bash', isCorrect: false },
          { content: 'init / systemd (PID 1)', isCorrect: true },
          { content: 'login', isCorrect: false },
          { content: 'grub', isCorrect: false },
        ],
      },
      {
        content: 'Which bootloader is most commonly used on modern Linux systems?',
        difficulty: 'Easy',
        choices: [
          { content: 'LILO', isCorrect: false },
          { content: 'GRUB2', isCorrect: true },
          { content: 'Syslinux', isCorrect: false },
          { content: 'rEFInd', isCorrect: false },
        ],
      },
      {
        content: 'What runlevel corresponds to multi-user mode with GUI in SysVinit?',
        difficulty: 'Medium',
        choices: [
          { content: '3', isCorrect: false },
          { content: '5', isCorrect: true },
          { content: '1', isCorrect: false },
          { content: '0', isCorrect: false },
        ],
      },
      {
        content: 'Which systemd target is equivalent to runlevel 3 (multi-user, no GUI)?',
        difficulty: 'Medium',
        choices: [
          { content: 'graphical.target', isCorrect: false },
          { content: 'multi-user.target', isCorrect: true },
          { content: 'rescue.target', isCorrect: false },
          { content: 'default.target', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows system logs from the systemd journal?',
        difficulty: 'Easy',
        choices: [
          { content: 'syslog', isCorrect: false },
          { content: 'journalctl', isCorrect: true },
          { content: 'dmesg', isCorrect: false },
          { content: 'logview', isCorrect: false },
        ],
      },
      {
        content: 'Where are traditional syslog messages stored?',
        difficulty: 'Medium',
        choices: [
          { content: '/etc/syslog', isCorrect: false },
          { content: '/var/log/', isCorrect: true },
          { content: '/tmp/logs/', isCorrect: false },
          { content: '/usr/log/', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows kernel ring buffer messages?',
        difficulty: 'Hard',
        choices: [
          { content: 'journalctl -k or dmesg', isCorrect: true },
          { content: 'cat /etc/kernel.log', isCorrect: false },
          { content: 'kernlog --show', isCorrect: false },
          { content: 'sysctl --messages', isCorrect: false },
        ],
      },
      {
        content: 'What does "journalctl -u sshd --since today" do?',
        difficulty: 'Hard',
        choices: [
          { content: 'Shows all logs since the system was installed', isCorrect: false },
          { content: 'Shows SSH daemon logs from today only', isCorrect: true },
          { content: 'Restarts the SSH service', isCorrect: false },
          { content: 'Lists all units starting with sshd', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S5_DISK,
    assignmentName: 'Disk Management Quiz',
    questions: [
      {
        content: 'Which command is used to create partitions on a disk in Linux?',
        difficulty: 'Easy',
        choices: [
          { content: 'mkpart', isCorrect: false },
          { content: 'fdisk', isCorrect: true },
          { content: 'diskutil', isCorrect: false },
          { content: 'partition', isCorrect: false },
        ],
      },
      {
        content: 'What is the maximum number of primary partitions allowed on an MBR disk?',
        difficulty: 'Medium',
        choices: [
          { content: '2', isCorrect: false },
          { content: '4', isCorrect: true },
          { content: '8', isCorrect: false },
          { content: '16', isCorrect: false },
        ],
      },
      {
        content: 'Which command creates an ext4 filesystem on a partition?',
        difficulty: 'Medium',
        choices: [
          { content: 'format /dev/sdb1 ext4', isCorrect: false },
          { content: 'mkfs.ext4 /dev/sdb1', isCorrect: true },
          { content: 'create-fs ext4 /dev/sdb1', isCorrect: false },
          { content: 'fsck.ext4 /dev/sdb1', isCorrect: false },
        ],
      },
      {
        content: 'Which command mounts a filesystem to a directory?',
        difficulty: 'Easy',
        choices: [
          { content: 'attach', isCorrect: false },
          { content: 'mount', isCorrect: true },
          { content: 'link', isCorrect: false },
          { content: 'bind', isCorrect: false },
        ],
      },
      {
        content: 'What is the purpose of the /etc/fstab file?',
        difficulty: 'Medium',
        choices: [
          { content: 'To list all running processes', isCorrect: false },
          { content: 'To define filesystems that are automatically mounted at boot', isCorrect: true },
          { content: 'To configure the firewall', isCorrect: false },
          { content: 'To store disk encryption keys', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows disk usage for all mounted filesystems?',
        difficulty: 'Easy',
        choices: [
          { content: 'du -h', isCorrect: false },
          { content: 'df -h', isCorrect: true },
          { content: 'disk --usage', isCorrect: false },
          { content: 'mount --list', isCorrect: false },
        ],
      },
      {
        content: 'What does the "lsblk" command display?',
        difficulty: 'Easy',
        choices: [
          { content: 'Network interfaces', isCorrect: false },
          { content: 'Block devices and their mount points', isCorrect: true },
          { content: 'Running processes', isCorrect: false },
          { content: 'System logs', isCorrect: false },
        ],
      },
      {
        content: 'Which partition table type supports disks larger than 2TB?',
        difficulty: 'Medium',
        choices: [
          { content: 'MBR', isCorrect: false },
          { content: 'GPT', isCorrect: true },
          { content: 'FAT32', isCorrect: false },
          { content: 'NTFS', isCorrect: false },
        ],
      },
      {
        content: 'What does the "blkid" command do?',
        difficulty: 'Hard',
        choices: [
          { content: 'Blocks a device from being accessed', isCorrect: false },
          { content: 'Displays UUID and filesystem type of block devices', isCorrect: true },
          { content: 'Creates block devices', isCorrect: false },
          { content: 'Removes block device IDs', isCorrect: false },
        ],
      },
      {
        content: 'In /etc/fstab, what does the "0 2" at the end of an entry mean?',
        difficulty: 'Hard',
        choices: [
          { content: 'Mount priority and timeout', isCorrect: false },
          { content: 'Dump flag (0=no backup) and fsck order (2=check after root)', isCorrect: true },
          { content: 'User ID and group ID', isCorrect: false },
          { content: 'Read and write speed limits', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S6_LVM,
    assignmentName: 'LVM - Logical Volume Manager Quiz',
    questions: [
      {
        content: 'What does LVM stand for?',
        difficulty: 'Easy',
        choices: [
          { content: 'Linux Virtual Machine', isCorrect: false },
          { content: 'Logical Volume Manager', isCorrect: true },
          { content: 'Logical Virtualization Module', isCorrect: false },
          { content: 'Linux Volume Module', isCorrect: false },
        ],
      },
      {
        content: 'What is the correct order of LVM components from smallest to largest?',
        difficulty: 'Medium',
        choices: [
          { content: 'Volume Group → Physical Volume → Logical Volume', isCorrect: false },
          { content: 'Physical Volume → Volume Group → Logical Volume', isCorrect: true },
          { content: 'Logical Volume → Physical Volume → Volume Group', isCorrect: false },
          { content: 'Physical Volume → Logical Volume → Volume Group', isCorrect: false },
        ],
      },
      {
        content: 'Which command creates a Physical Volume?',
        difficulty: 'Easy',
        choices: [
          { content: 'vgcreate', isCorrect: false },
          { content: 'pvcreate', isCorrect: true },
          { content: 'lvcreate', isCorrect: false },
          { content: 'pvmake', isCorrect: false },
        ],
      },
      {
        content: 'Which command creates a Logical Volume?',
        difficulty: 'Medium',
        choices: [
          { content: 'lvcreate -L 10G -n myvolume vgname', isCorrect: true },
          { content: 'vgcreate -L 10G -n myvolume vgname', isCorrect: false },
          { content: 'pvcreate -L 10G -n myvolume vgname', isCorrect: false },
          { content: 'mklv -L 10G -n myvolume vgname', isCorrect: false },
        ],
      },
      {
        content: 'Which command extends a Logical Volume by 5GB?',
        difficulty: 'Medium',
        choices: [
          { content: 'lvextend -L +5G /dev/vg/lv', isCorrect: true },
          { content: 'lvresize -add 5G /dev/vg/lv', isCorrect: false },
          { content: 'vgextend -L +5G /dev/vg/lv', isCorrect: false },
          { content: 'lvgrow -L 5G /dev/vg/lv', isCorrect: false },
        ],
      },
      {
        content: 'After extending an LVM Logical Volume, what must you also do?',
        difficulty: 'Hard',
        choices: [
          { content: 'Reboot the system', isCorrect: false },
          { content: 'Resize the filesystem (e.g., resize2fs)', isCorrect: true },
          { content: 'Recreate the Volume Group', isCorrect: false },
          { content: 'Nothing, it resizes automatically', isCorrect: false },
        ],
      },
      {
        content: 'What is an LVM snapshot used for?',
        difficulty: 'Medium',
        choices: [
          { content: 'Taking a screenshot of the desktop', isCorrect: false },
          { content: 'Creating a point-in-time copy of a logical volume for backup', isCorrect: true },
          { content: 'Encrypting the volume', isCorrect: false },
          { content: 'Compressing the volume data', isCorrect: false },
        ],
      },
      {
        content: 'Which command displays information about all Volume Groups?',
        difficulty: 'Hard',
        choices: [
          { content: 'vgdisplay or vgs', isCorrect: true },
          { content: 'lvdisplay', isCorrect: false },
          { content: 'pvdisplay', isCorrect: false },
          { content: 'df -vg', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S7_USER_MGMT,
    assignmentName: 'User Management Quiz',
    questions: [
      {
        content: 'Which file stores user account information in Linux?',
        difficulty: 'Easy',
        choices: [
          { content: '/etc/users', isCorrect: false },
          { content: '/etc/passwd', isCorrect: true },
          { content: '/etc/accounts', isCorrect: false },
          { content: '/var/users', isCorrect: false },
        ],
      },
      {
        content: 'Which file stores encrypted user passwords?',
        difficulty: 'Easy',
        choices: [
          { content: '/etc/passwd', isCorrect: false },
          { content: '/etc/shadow', isCorrect: true },
          { content: '/etc/password', isCorrect: false },
          { content: '/etc/secure', isCorrect: false },
        ],
      },
      {
        content: 'Which command creates a new user account?',
        difficulty: 'Easy',
        choices: [
          { content: 'adduser (or useradd)', isCorrect: true },
          { content: 'newuser', isCorrect: false },
          { content: 'mkuser', isCorrect: false },
          { content: 'createuser', isCorrect: false },
        ],
      },
      {
        content: 'Which command changes the password for a user?',
        difficulty: 'Easy',
        choices: [
          { content: 'chpass', isCorrect: false },
          { content: 'passwd', isCorrect: true },
          { content: 'setpass', isCorrect: false },
          { content: 'usermod -p', isCorrect: false },
        ],
      },
      {
        content: 'Which command adds an existing user to a supplementary group?',
        difficulty: 'Medium',
        choices: [
          { content: 'usermod -aG groupname username', isCorrect: true },
          { content: 'groupadd username groupname', isCorrect: false },
          { content: 'addgroup username groupname', isCorrect: false },
          { content: 'usermod -g groupname username', isCorrect: false },
        ],
      },
      {
        content: 'What is the UID of the root user?',
        difficulty: 'Easy',
        choices: [
          { content: '1', isCorrect: false },
          { content: '0', isCorrect: true },
          { content: '1000', isCorrect: false },
          { content: '-1', isCorrect: false },
        ],
      },
      {
        content: 'Which file contains the sudo privileges configuration?',
        difficulty: 'Medium',
        choices: [
          { content: '/etc/sudo.conf', isCorrect: false },
          { content: '/etc/sudoers', isCorrect: true },
          { content: '/etc/sudo/config', isCorrect: false },
          { content: '/etc/su.conf', isCorrect: false },
        ],
      },
      {
        content: 'Which command should be used to safely edit the sudoers file?',
        difficulty: 'Medium',
        choices: [
          { content: 'vi /etc/sudoers', isCorrect: false },
          { content: 'visudo', isCorrect: true },
          { content: 'nano /etc/sudoers', isCorrect: false },
          { content: 'sudoedit /etc/sudoers', isCorrect: false },
        ],
      },
      {
        content: 'What does "usermod -L username" do?',
        difficulty: 'Hard',
        choices: [
          { content: 'Lists the user details', isCorrect: false },
          { content: 'Locks the user account (disables password login)', isCorrect: true },
          { content: 'Logs out the user', isCorrect: false },
          { content: 'Changes the user login shell', isCorrect: false },
        ],
      },
      {
        content: 'Which file stores group information?',
        difficulty: 'Medium',
        choices: [
          { content: '/etc/groups', isCorrect: false },
          { content: '/etc/group', isCorrect: true },
          { content: '/etc/grp', isCorrect: false },
          { content: '/var/group', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S8_NETWORKING,
    assignmentName: 'Networking Quiz',
    questions: [
      {
        content: 'Which command displays the IP address configuration on modern Linux systems?',
        difficulty: 'Easy',
        choices: [
          { content: 'ipconfig', isCorrect: false },
          { content: 'ip addr show', isCorrect: true },
          { content: 'netstat -ip', isCorrect: false },
          { content: 'show-ip', isCorrect: false },
        ],
      },
      {
        content: 'What is the loopback address in IPv4?',
        difficulty: 'Easy',
        choices: [
          { content: '192.168.1.1', isCorrect: false },
          { content: '127.0.0.1', isCorrect: true },
          { content: '10.0.0.1', isCorrect: false },
          { content: '0.0.0.0', isCorrect: false },
        ],
      },
      {
        content: 'Which command tests network connectivity to a remote host?',
        difficulty: 'Easy',
        choices: [
          { content: 'traceroute', isCorrect: false },
          { content: 'ping', isCorrect: true },
          { content: 'netstat', isCorrect: false },
          { content: 'curl', isCorrect: false },
        ],
      },
      {
        content: 'Which file is used to configure DNS resolver settings?',
        difficulty: 'Medium',
        choices: [
          { content: '/etc/hosts', isCorrect: false },
          { content: '/etc/resolv.conf', isCorrect: true },
          { content: '/etc/dns.conf', isCorrect: false },
          { content: '/etc/network/dns', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows the routing table?',
        difficulty: 'Medium',
        choices: [
          { content: 'ip route show (or route -n)', isCorrect: true },
          { content: 'netstat -a', isCorrect: false },
          { content: 'show routes', isCorrect: false },
          { content: 'routetable', isCorrect: false },
        ],
      },
      {
        content: 'Which tool traces the path packets take to reach a destination?',
        difficulty: 'Medium',
        choices: [
          { content: 'ping', isCorrect: false },
          { content: 'traceroute (or tracepath)', isCorrect: true },
          { content: 'netstat', isCorrect: false },
          { content: 'dig', isCorrect: false },
        ],
      },
      {
        content: 'Which iptables chain handles incoming packets destined for the local system?',
        difficulty: 'Medium',
        choices: [
          { content: 'OUTPUT', isCorrect: false },
          { content: 'INPUT', isCorrect: true },
          { content: 'FORWARD', isCorrect: false },
          { content: 'PREROUTING', isCorrect: false },
        ],
      },
      {
        content: 'Which command opens port 80 (HTTP) in firewalld permanently?',
        difficulty: 'Hard',
        choices: [
          { content: 'firewall-cmd --permanent --add-port=80/tcp', isCorrect: true },
          { content: 'iptables -A INPUT -p tcp --dport 80 -j ACCEPT', isCorrect: false },
          { content: 'ufw allow 80', isCorrect: false },
          { content: 'firewalld --open 80', isCorrect: false },
        ],
      },
      {
        content: 'What does the "ss -tulnp" command show?',
        difficulty: 'Hard',
        choices: [
          { content: 'System storage usage', isCorrect: false },
          { content: 'Listening TCP/UDP sockets with process info', isCorrect: true },
          { content: 'Network traffic statistics', isCorrect: false },
          { content: 'SSH tunnel configurations', isCorrect: false },
        ],
      },
      {
        content: 'Which subnet mask corresponds to a /24 CIDR notation?',
        difficulty: 'Medium',
        choices: [
          { content: '255.255.0.0', isCorrect: false },
          { content: '255.255.255.0', isCorrect: true },
          { content: '255.255.255.128', isCorrect: false },
          { content: '255.0.0.0', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S9_ADV_PERMS,
    assignmentName: 'Advanced Linux Permissions Quiz',
    questions: [
      {
        content: 'What does the SetUID permission do when set on an executable file?',
        difficulty: 'Medium',
        choices: [
          { content: 'Runs the file as the group owner', isCorrect: false },
          { content: 'Runs the file with the permissions of the file owner', isCorrect: true },
          { content: 'Prevents the file from being deleted', isCorrect: false },
          { content: 'Makes the file read-only', isCorrect: false },
        ],
      },
      {
        content: 'Which numeric value represents SetUID in chmod?',
        difficulty: 'Medium',
        choices: [
          { content: '1000', isCorrect: false },
          { content: '4000', isCorrect: true },
          { content: '2000', isCorrect: false },
          { content: '0100', isCorrect: false },
        ],
      },
      {
        content: 'What does the Sticky Bit do when set on a directory?',
        difficulty: 'Medium',
        choices: [
          { content: 'Only the file owner (or root) can delete files within it', isCorrect: true },
          { content: 'All files inherit the directory group', isCorrect: false },
          { content: 'The directory becomes read-only', isCorrect: false },
          { content: 'Files in it cannot be modified', isCorrect: false },
        ],
      },
      {
        content: 'Which common directory has the Sticky Bit set by default?',
        difficulty: 'Easy',
        choices: [
          { content: '/home', isCorrect: false },
          { content: '/tmp', isCorrect: true },
          { content: '/var', isCorrect: false },
          { content: '/etc', isCorrect: false },
        ],
      },
      {
        content: 'What does SetGID on a directory cause?',
        difficulty: 'Hard',
        choices: [
          { content: 'New files created inside inherit the directory group ownership', isCorrect: true },
          { content: 'The directory can only be accessed by the group', isCorrect: false },
          { content: 'Files are automatically encrypted', isCorrect: false },
          { content: 'The directory is hidden from other users', isCorrect: false },
        ],
      },
      {
        content: 'Which command sets an ACL to give user "john" read access to a file?',
        difficulty: 'Hard',
        choices: [
          { content: 'setfacl -m u:john:r file.txt', isCorrect: true },
          { content: 'chmod john:r file.txt', isCorrect: false },
          { content: 'acl --add john:read file.txt', isCorrect: false },
          { content: 'chacl u:john:r file.txt', isCorrect: false },
        ],
      },
      {
        content: 'Which command displays the ACL of a file?',
        difficulty: 'Medium',
        choices: [
          { content: 'ls -acl', isCorrect: false },
          { content: 'getfacl file.txt', isCorrect: true },
          { content: 'showacl file.txt', isCorrect: false },
          { content: 'acl --show file.txt', isCorrect: false },
        ],
      },
      {
        content: 'In "ls -l" output, what does a "+" at the end of permissions indicate?',
        difficulty: 'Hard',
        choices: [
          { content: 'The file is a symbolic link', isCorrect: false },
          { content: 'The file has extended ACLs', isCorrect: true },
          { content: 'The file has SetUID set', isCorrect: false },
          { content: 'The file is immutable', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S10_SHELL_SCRIPT,
    assignmentName: 'Shell Scripting Quiz',
    questions: [
      {
        content: 'What is the correct shebang line for a Bash script?',
        difficulty: 'Easy',
        choices: [
          { content: '#!bash', isCorrect: false },
          { content: '#!/bin/bash', isCorrect: true },
          { content: '//bin/bash', isCorrect: false },
          { content: '#!/bash/bin', isCorrect: false },
        ],
      },
      {
        content: 'How do you declare a variable in Bash?',
        difficulty: 'Easy',
        choices: [
          { content: 'var NAME = "value"', isCorrect: false },
          { content: 'NAME="value"', isCorrect: true },
          { content: 'set NAME "value"', isCorrect: false },
          { content: '$NAME = "value"', isCorrect: false },
        ],
      },
      {
        content: 'How do you access the value of a variable named "NAME" in Bash?',
        difficulty: 'Easy',
        choices: [
          { content: 'NAME', isCorrect: false },
          { content: '$NAME', isCorrect: true },
          { content: '%NAME%', isCorrect: false },
          { content: '${NAME()}', isCorrect: false },
        ],
      },
      {
        content: 'Which operator tests if a file exists in Bash?',
        difficulty: 'Medium',
        choices: [
          { content: '-e', isCorrect: true },
          { content: '-x', isCorrect: false },
          { content: '-s', isCorrect: false },
          { content: '-n', isCorrect: false },
        ],
      },
      {
        content: 'What does "$?" represent in a Bash script?',
        difficulty: 'Medium',
        choices: [
          { content: 'The process ID of the script', isCorrect: false },
          { content: 'The exit status of the last executed command', isCorrect: true },
          { content: 'The number of arguments passed', isCorrect: false },
          { content: 'The script filename', isCorrect: false },
        ],
      },
      {
        content: 'Which loop syntax is correct in Bash?',
        difficulty: 'Medium',
        choices: [
          { content: 'for i in 1 2 3; do echo $i; done', isCorrect: true },
          { content: 'for (i = 1; i <= 3; i++) { echo i; }', isCorrect: false },
          { content: 'foreach i (1 2 3) echo $i end', isCorrect: false },
          { content: 'loop i in 1 2 3: echo $i; endloop', isCorrect: false },
        ],
      },
      {
        content: 'How do you define a function in Bash?',
        difficulty: 'Medium',
        choices: [
          { content: 'function myFunc() { commands; }', isCorrect: true },
          { content: 'def myFunc(): commands', isCorrect: false },
          { content: 'func myFunc { commands }', isCorrect: false },
          { content: 'create function myFunc { commands }', isCorrect: false },
        ],
      },
      {
        content: 'What does "$@" represent in a Bash script?',
        difficulty: 'Hard',
        choices: [
          { content: 'The script name', isCorrect: false },
          { content: 'All positional parameters, each as a separate word', isCorrect: true },
          { content: 'The number of arguments', isCorrect: false },
          { content: 'The last argument only', isCorrect: false },
        ],
      },
      {
        content: 'What is the difference between single quotes and double quotes in Bash?',
        difficulty: 'Hard',
        choices: [
          { content: 'No difference, they are interchangeable', isCorrect: false },
          { content: 'Single quotes preserve literal text; double quotes allow variable expansion', isCorrect: true },
          { content: 'Single quotes are for numbers; double quotes are for strings', isCorrect: false },
          { content: 'Double quotes prevent command execution', isCorrect: false },
        ],
      },
      {
        content: 'Which special variable holds the number of arguments passed to a script?',
        difficulty: 'Medium',
        choices: [
          { content: '$0', isCorrect: false },
          { content: '$#', isCorrect: true },
          { content: '$*', isCorrect: false },
          { content: '$!', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S11_ADV_CLI,
    assignmentName: 'Advanced Command Line Skills Quiz',
    questions: [
      {
        content: 'Which grep option performs a case-insensitive search?',
        difficulty: 'Easy',
        choices: [
          { content: '-v', isCorrect: false },
          { content: '-i', isCorrect: true },
          { content: '-c', isCorrect: false },
          { content: '-r', isCorrect: false },
        ],
      },
      {
        content: 'Which grep option shows line numbers with matches?',
        difficulty: 'Easy',
        choices: [
          { content: '-l', isCorrect: false },
          { content: '-n', isCorrect: true },
          { content: '-c', isCorrect: false },
          { content: '-w', isCorrect: false },
        ],
      },
      {
        content: 'Which sed command replaces all occurrences of "old" with "new" in a file?',
        difficulty: 'Medium',
        choices: [
          { content: "sed 's/old/new/' file", isCorrect: false },
          { content: "sed 's/old/new/g' file", isCorrect: true },
          { content: "sed 'replace old new' file", isCorrect: false },
          { content: "sed -r 'old->new' file", isCorrect: false },
        ],
      },
      {
        content: 'In awk, which variable represents the entire current line?',
        difficulty: 'Medium',
        choices: [
          { content: '$1', isCorrect: false },
          { content: '$0', isCorrect: true },
          { content: '$NF', isCorrect: false },
          { content: '$LINE', isCorrect: false },
        ],
      },
      {
        content: 'Which awk command prints the third column of a file?',
        difficulty: 'Medium',
        choices: [
          { content: "awk '{print $3}' file", isCorrect: true },
          { content: "awk 'column 3' file", isCorrect: false },
          { content: "awk -f 3 file", isCorrect: false },
          { content: "awk '{col=3}' file", isCorrect: false },
        ],
      },
      {
        content: 'What does the "xargs" command do?',
        difficulty: 'Hard',
        choices: [
          { content: 'Extracts arguments from a config file', isCorrect: false },
          { content: 'Builds and executes commands from standard input', isCorrect: true },
          { content: 'Displays extra command arguments', isCorrect: false },
          { content: 'Validates command line arguments', isCorrect: false },
        ],
      },
      {
        content: 'Which command combination counts the number of files in the current directory?',
        difficulty: 'Hard',
        choices: [
          { content: 'ls | wc -l', isCorrect: true },
          { content: 'count -f .', isCorrect: false },
          { content: 'dir --count', isCorrect: false },
          { content: 'find -count', isCorrect: false },
        ],
      },
      {
        content: 'What does "grep -r pattern /path" do?',
        difficulty: 'Medium',
        choices: [
          { content: 'Replaces pattern in all files', isCorrect: false },
          { content: 'Recursively searches for pattern in all files under /path', isCorrect: true },
          { content: 'Reverses the search results', isCorrect: false },
          { content: 'Shows only files that do not match', isCorrect: false },
        ],
      },
    ],
  },
  {
    sectionId: SECTIONS.S12_EXTRAS,
    assignmentName: 'System Monitoring and Extras Quiz',
    questions: [
      {
        content: 'Which command provides a real-time view of system processes and resource usage?',
        difficulty: 'Easy',
        choices: [
          { content: 'ps aux', isCorrect: false },
          { content: 'top (or htop)', isCorrect: true },
          { content: 'sysctl', isCorrect: false },
          { content: 'systemctl status', isCorrect: false },
        ],
      },
      {
        content: 'Which command shows memory usage in a human-readable format?',
        difficulty: 'Easy',
        choices: [
          { content: 'mem -h', isCorrect: false },
          { content: 'free -h', isCorrect: true },
          { content: 'memory --show', isCorrect: false },
          { content: 'ram -usage', isCorrect: false },
        ],
      },
      {
        content: 'Which command monitors disk I/O statistics?',
        difficulty: 'Medium',
        choices: [
          { content: 'df -io', isCorrect: false },
          { content: 'iostat', isCorrect: true },
          { content: 'diskmon', isCorrect: false },
          { content: 'iocheck', isCorrect: false },
        ],
      },
      {
        content: 'What does the "uptime" command display?',
        difficulty: 'Easy',
        choices: [
          { content: 'Disk uptime and health', isCorrect: false },
          { content: 'System uptime, logged-in users, and load averages', isCorrect: true },
          { content: 'Network uptime statistics', isCorrect: false },
          { content: 'Process uptime information', isCorrect: false },
        ],
      },
      {
        content: 'Which tool is commonly used for creating scheduled backups in Linux?',
        difficulty: 'Medium',
        choices: [
          { content: 'backup-manager', isCorrect: false },
          { content: 'rsync (often with cron)', isCorrect: true },
          { content: 'sysbackup', isCorrect: false },
          { content: 'tar-daemon', isCorrect: false },
        ],
      },
      {
        content: 'What does the load average represent in Linux?',
        difficulty: 'Medium',
        choices: [
          { content: 'CPU temperature over time', isCorrect: false },
          { content: 'Average number of processes waiting for CPU over 1, 5, and 15 minutes', isCorrect: true },
          { content: 'Network bandwidth usage', isCorrect: false },
          { content: 'Disk read/write speed', isCorrect: false },
        ],
      },
      {
        content: 'Which rsync flag preserves file permissions, ownership, and timestamps?',
        difficulty: 'Hard',
        choices: [
          { content: '-r', isCorrect: false },
          { content: '-a (archive mode)', isCorrect: true },
          { content: '-v', isCorrect: false },
          { content: '-z', isCorrect: false },
        ],
      },
      {
        content: 'Which command adjusts the priority (niceness) of a running process?',
        difficulty: 'Hard',
        choices: [
          { content: 'priority PID value', isCorrect: false },
          { content: 'renice value -p PID', isCorrect: true },
          { content: 'setprio PID value', isCorrect: false },
          { content: 'chprio value PID', isCorrect: false },
        ],
      },
    ],
  },
];

// ==================== MAIN FUNCTION ====================

async function addLinuxMCQ() {
  try {
    console.log('🚀 Adding MCQ questions for Linux Administration Bootcamp...\n');

    // Get the creator ID (first instructor/admin user)
    const course = await prisma.courses.findUnique({
      where: { Id: COURSE_ID },
      select: { CreatorId: true, Title: true },
    });

    if (!course) {
      console.error('❌ Course not found!');
      return;
    }

    console.log(`📚 Course: "${course.Title}"`);
    console.log(`👤 Creator: ${course.CreatorId}\n`);

    let totalQuestions = 0;
    let totalAssignments = 0;

    for (const section of quizData) {
      console.log(`\n📝 Processing: ${section.assignmentName}`);

      // Check if assignment already exists for this section
      const existing = await prisma.assignments.findFirst({
        where: {
          SectionId: section.sectionId,
          Name: section.assignmentName,
        },
      });

      if (existing) {
        console.log(`  ⚠️ Assignment already exists (ID: ${existing.Id}), skipping...`);
        continue;
      }

      // Create assignment with questions
      const assignment = await prisma.assignments.create({
        data: {
          Name: section.assignmentName,
          Duration: 15, // 15 minutes per quiz
          GradeToPass: 7,
          SectionId: section.sectionId,
          CreatorId: course.CreatorId,
          QuestionCount: section.questions.length,
          McqQuestions: {
            create: section.questions.map((q) => {
              const irt = getIRTParams(q.difficulty);
              return {
                Content: q.content,
                Difficulty: q.difficulty,
                ParamA: irt.ParamA,
                ParamB: irt.ParamB,
                ParamC: irt.ParamC,
                McqChoices: {
                  create: q.choices.map((c) => ({
                    Content: c.content,
                    IsCorrect: c.isCorrect,
                  })),
                },
              };
            }),
          },
        },
        include: {
          McqQuestions: { include: { McqChoices: true } },
        },
      });

      totalAssignments++;
      totalQuestions += section.questions.length;
      console.log(`  ✅ Created assignment: ${assignment.Name} (${section.questions.length} questions)`);
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎉 Done! Created ${totalAssignments} assignments with ${totalQuestions} questions total.`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLinuxMCQ();
