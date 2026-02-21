import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── CLEAN SLATE ────────────────────────────────────────────────────────
  console.log('🧹 Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.note.deleteMany()
  await prisma.application.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.job.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Data cleared')

  // ─── USERS ───────────────────────────────────────────────────────────────
  const adminHash     = await bcrypt.hash('admin123', 10)
  const recruiterHash = await bcrypt.hash('recruiter123', 10)
  const hmHash        = await bcrypt.hash('manager123', 10)
  const rec2Hash      = await bcrypt.hash('sarah123', 10)
  const rec3Hash      = await bcrypt.hash('mike123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atobs.com' },
    update: {},
    create: { email: 'admin@atobs.com', passwordHash: adminHash, fullName: 'Admin User', role: 'admin' },
  })

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@atobs.com' },
    update: {},
    create: { email: 'recruiter@atobs.com', passwordHash: recruiterHash, fullName: 'Jane Recruiter', role: 'recruiter' },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@atobs.com' },
    update: {},
    create: { email: 'manager@atobs.com', passwordHash: hmHash, fullName: 'Bob Manager', role: 'hiring_manager' },
  })

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@atobs.com' },
    update: {},
    create: { email: 'sarah@atobs.com', passwordHash: rec2Hash, fullName: 'Sarah Thompson', role: 'recruiter' },
  })

  const mike = await prisma.user.upsert({
    where: { email: 'mike@atobs.com' },
    update: {},
    create: { email: 'mike@atobs.com', passwordHash: rec3Hash, fullName: 'Mike Chen', role: 'recruiter' },
  })

  console.log('✅ Users created')

  // ─── JOBS ─────────────────────────────────────────────────────────────────
  const job1 = await prisma.job.upsert({
    where: { id: 'seed-job-1' },
    update: {},
    create: {
      id: 'seed-job-1',
      title: 'Senior Java Developer',
      department: 'Engineering',
      locationCity: 'Dallas', locationState: 'TX',
      isRemote: false, jobType: 'c2c', visaSponsorship: true,
      publicTitle: 'Senior Java Developer',
      publicDescription: 'We are looking for an experienced Java developer to join our client\'s team in Dallas. You will work on enterprise-grade applications using Spring Boot and microservices architecture.',
      prerequisites: '5+ years Java, Spring Boot, REST APIs, SQL. H1B welcome.',
      responsibilities: 'Design and develop backend services, participate in code reviews, work with cross-functional teams.',
      showSalary: false, salaryMin: 90000, salaryMax: 120000,
      isPublished: true, status: 'open',
      createdById: admin.id, assignedRecruiterId: recruiter.id,
    },
  })

  const job2 = await prisma.job.upsert({
    where: { id: 'seed-job-2' },
    update: {},
    create: {
      id: 'seed-job-2',
      title: 'React Frontend Engineer',
      department: 'Engineering',
      locationCity: 'Austin', locationState: 'TX',
      isRemote: true, jobType: 'full_time', visaSponsorship: true,
      publicTitle: 'React Frontend Engineer',
      publicDescription: 'Join a fast-growing startup as a React engineer. Build beautiful, performant user interfaces and work closely with the product team.',
      prerequisites: '3+ years React, TypeScript, REST APIs. OPT/H1B/GC welcome.',
      responsibilities: 'Build React components, collaborate with designers, ensure cross-browser compatibility, write tests.',
      showSalary: true, salaryMin: 100000, salaryMax: 140000,
      isPublished: true, status: 'open',
      createdById: admin.id, assignedRecruiterId: sarah.id,
    },
  })

  const job3 = await prisma.job.upsert({
    where: { id: 'seed-job-3' },
    update: {},
    create: {
      id: 'seed-job-3',
      title: 'DevOps / Cloud Engineer',
      department: 'Infrastructure',
      locationCity: 'Houston', locationState: 'TX',
      isRemote: false, jobType: 'w2', visaSponsorship: true,
      publicTitle: 'DevOps / Cloud Engineer',
      publicDescription: 'Looking for a DevOps engineer with strong AWS and Kubernetes experience to modernize our infrastructure stack.',
      prerequisites: 'AWS, Kubernetes, Terraform, CI/CD pipelines. 4+ years experience.',
      responsibilities: 'Manage cloud infrastructure, build CI/CD pipelines, ensure 99.9% uptime, mentor junior engineers.',
      showSalary: true, salaryMin: 110000, salaryMax: 145000,
      isPublished: true, status: 'open',
      createdById: admin.id, assignedRecruiterId: mike.id,
    },
  })

  const job4 = await prisma.job.upsert({
    where: { id: 'seed-job-4' },
    update: {},
    create: {
      id: 'seed-job-4',
      title: 'Full Stack Python Developer',
      department: 'Engineering',
      locationCity: 'Remote', locationState: '',
      isRemote: true, jobType: 'contract', visaSponsorship: false,
      publicTitle: 'Full Stack Python Developer',
      publicDescription: 'Contract role building internal tools using Python/Django/React. US Citizens and GC holders only.',
      prerequisites: 'Python, Django, React, PostgreSQL. 3+ years experience.',
      responsibilities: 'Build and maintain internal tooling, integrate APIs, work directly with stakeholders.',
      showSalary: false, salaryMin: 80000, salaryMax: 105000,
      isPublished: true, status: 'open',
      createdById: admin.id, assignedRecruiterId: recruiter.id,
    },
  })

  const job5 = await prisma.job.upsert({
    where: { id: 'seed-job-5' },
    update: {},
    create: {
      id: 'seed-job-5',
      title: '.NET / C# Developer',
      department: 'Engineering',
      locationCity: 'Plano', locationState: 'TX',
      isRemote: false, jobType: 'c2c', visaSponsorship: true,
      publicTitle: '.NET / C# Developer',
      publicDescription: 'Our client needs a strong .NET developer for a 12-month engagement building enterprise finance software.',
      prerequisites: 'C#, .NET 6+, SQL Server, Azure. 4+ years experience. H1B, OPT welcome.',
      responsibilities: 'Develop financial modules, integrate with third-party APIs, write unit tests, participate in sprint planning.',
      showSalary: false, salaryMin: 95000, salaryMax: 125000,
      isPublished: true, status: 'open',
      createdById: admin.id, assignedRecruiterId: sarah.id,
    },
  })

  await prisma.job.upsert({
    where: { id: 'seed-job-6' },
    update: {},
    create: {
      id: 'seed-job-6',
      title: 'QA Automation Engineer',
      department: 'QA',
      locationCity: 'Irving', locationState: 'TX',
      isRemote: false, jobType: 'w2', visaSponsorship: false,
      publicTitle: 'QA Automation Engineer',
      publicDescription: 'Seeking a QA Automation engineer to build test frameworks and ensure product quality.',
      prerequisites: 'Selenium, TestNG, Java/Python. 3+ years experience. GC/Citizen only.',
      responsibilities: 'Write automation scripts, maintain test suites, report bugs, collaborate with dev team.',
      showSalary: true, salaryMin: 85000, salaryMax: 110000,
      isPublished: false, status: 'on_hold',
      createdById: admin.id,
    },
  })

  console.log('✅ Jobs created')

  // ─── CANDIDATES ───────────────────────────────────────────────────────────
  const candidateData = [
    // 0 - Rahul Sharma
    { id: 'seed-c-01', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@email.com', phone: '4695551234', locationCity: 'Dallas', locationState: 'TX', linkedinUrl: 'https://linkedin.com/in/rahulsharma', visaStatus: 'h1b', currentEmployer: 'TechCorp Inc', experienceYears: 6, salaryExpectation: 105000, skills: '["Java","Spring Boot","Microservices","AWS","SQL"]', source: 'job_board' },
    // 1 - Priya Patel
    { id: 'seed-c-02', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@email.com', phone: '5125559876', locationCity: 'Austin', locationState: 'TX', visaStatus: 'opt', currentEmployer: 'StartupXYZ', experienceYears: 3, salaryExpectation: 95000, skills: '["React","TypeScript","Node.js","CSS","Redux"]', source: 'job_board' },
    // 2 - Anil Kumar
    { id: 'seed-c-03', firstName: 'Anil', lastName: 'Kumar', email: 'anil.kumar@email.com', phone: '9725554321', locationCity: 'Houston', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'BigBank Corp', experienceYears: 8, salaryExpectation: 115000, skills: '["Java","Kafka","Docker","Kubernetes","PostgreSQL"]', source: 'job_board' },
    // 3 - Meera Singh
    { id: 'seed-c-04', firstName: 'Meera', lastName: 'Singh', email: 'meera.singh@email.com', phone: '2145558765', locationCity: 'Plano', locationState: 'TX', visaStatus: 'stem_opt', experienceYears: 2, salaryExpectation: 85000, skills: '["React","JavaScript","HTML","CSS","Redux","Figma"]', source: 'job_board' },
    // 4 - Vikram Nair
    { id: 'seed-c-05', firstName: 'Vikram', lastName: 'Nair', email: 'vikram.nair@email.com', phone: '4695557890', locationCity: 'Dallas', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'ConsultingFirm LLC', experienceYears: 5, salaryExpectation: 100000, skills: '["Java","Spring","Hibernate","MySQL","Jenkins","Maven"]', source: 'internal' },
    // 5 - Divya Reddy
    { id: 'seed-c-06', firstName: 'Divya', lastName: 'Reddy', email: 'divya.reddy@email.com', phone: '5125553456', locationCity: 'Austin', locationState: 'TX', visaStatus: 'ead', currentEmployer: 'WebAgency Co', experienceYears: 4, salaryExpectation: 110000, skills: '["React","Next.js","TypeScript","GraphQL","AWS","Tailwind"]', source: 'job_board' },
    // 6 - Suresh Babu
    { id: 'seed-c-07', firstName: 'Suresh', lastName: 'Babu', email: 'suresh.babu@email.com', phone: '8175552345', locationCity: 'Fort Worth', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'LegacyTech', experienceYears: 7, salaryExpectation: 108000, skills: '["Java","Oracle","PL/SQL","Spring Batch","IBM MQ"]', source: 'referral' },
    // 7 - Nisha Gupta
    { id: 'seed-c-08', firstName: 'Nisha', lastName: 'Gupta', email: 'nisha.gupta@email.com', phone: '9725556789', locationCity: 'Irving', locationState: 'TX', visaStatus: 'opt', experienceYears: 1, salaryExpectation: 75000, skills: '["React","Python","Django","HTML","CSS"]', source: 'job_board' },
    // 8 - Arjun Menon
    { id: 'seed-c-09', firstName: 'Arjun', lastName: 'Menon', email: 'arjun.menon@email.com', phone: '4695558901', locationCity: 'Dallas', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'CloudSystems Inc', experienceYears: 9, salaryExpectation: 130000, skills: '["AWS","Terraform","Kubernetes","Docker","Ansible","Python"]', source: 'referral' },
    // 9 - Pooja Iyer
    { id: 'seed-c-10', firstName: 'Pooja', lastName: 'Iyer', email: 'pooja.iyer@email.com', phone: '5125550011', locationCity: 'Round Rock', locationState: 'TX', visaStatus: 'gc', currentEmployer: 'DataFlow Corp', experienceYears: 5, salaryExpectation: 115000, skills: '["Python","Django","React","PostgreSQL","Redis","AWS"]', source: 'job_board' },
    // 10 - Kiran Shah
    { id: 'seed-c-11', firstName: 'Kiran', lastName: 'Shah', email: 'kiran.shah@email.com', phone: '9725550022', locationCity: 'Frisco', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'FinTech Solutions', experienceYears: 6, salaryExpectation: 118000, skills: '["C#",".NET","Azure","SQL Server","Angular","WCF"]', source: 'job_board' },
    // 11 - Deepa Krishnamurthy
    { id: 'seed-c-12', firstName: 'Deepa', lastName: 'Krishnamurthy', email: 'deepa.k@email.com', phone: '2145550033', locationCity: 'McKinney', locationState: 'TX', visaStatus: 'stem_opt', currentEmployer: 'Accenture', experienceYears: 3, salaryExpectation: 90000, skills: '["C#",".NET Core","SQL Server","Azure DevOps","React"]', source: 'job_board' },
    // 12 - Ravi Teja
    { id: 'seed-c-13', firstName: 'Ravi', lastName: 'Teja', email: 'ravi.teja@email.com', phone: '8175550044', locationCity: 'Garland', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'Infosys', experienceYears: 7, salaryExpectation: 110000, skills: '["Java","Microservices","Spring Cloud","AWS","CI/CD"]', source: 'internal' },
    // 13 - Sneha Kulkarni
    { id: 'seed-c-14', firstName: 'Sneha', lastName: 'Kulkarni', email: 'sneha.kulkarni@email.com', phone: '4695550055', locationCity: 'Allen', locationState: 'TX', visaStatus: 'opt', experienceYears: 2, salaryExpectation: 80000, skills: '["React","Vue.js","JavaScript","HTML","CSS","Node.js"]', source: 'job_board' },
    // 14 - Manish Verma
    { id: 'seed-c-15', firstName: 'Manish', lastName: 'Verma', email: 'manish.verma@email.com', phone: '5125550066', locationCity: 'Cedar Park', locationState: 'TX', visaStatus: 'citizen', currentEmployer: 'Local Startup', experienceYears: 4, salaryExpectation: 95000, skills: '["Python","FastAPI","React","PostgreSQL","GCP","Celery"]', source: 'referral' },
    // 15 - Lakshmi Narayanan
    { id: 'seed-c-16', firstName: 'Lakshmi', lastName: 'Narayanan', email: 'lakshmi.n@email.com', phone: '9725550077', locationCity: 'Lewisville', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'IBM', experienceYears: 10, salaryExpectation: 135000, skills: '["Java","Spring Boot","Kafka","AWS","Microservices","Oracle"]', source: 'job_board' },
    // 16 - Rohan Desai
    { id: 'seed-c-17', firstName: 'Rohan', lastName: 'Desai', email: 'rohan.desai@email.com', phone: '2145550088', locationCity: 'Carrollton', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'Wipro', experienceYears: 5, salaryExpectation: 100000, skills: '["AWS","Azure","Terraform","Jenkins","Kubernetes","Ansible"]', source: 'job_board' },
    // 17 - Ananya Bose
    { id: 'seed-c-18', firstName: 'Ananya', lastName: 'Bose', email: 'ananya.bose@email.com', phone: '8175550099', locationCity: 'Richardson', locationState: 'TX', visaStatus: 'gc', currentEmployer: 'Freelance', experienceYears: 6, salaryExpectation: 120000, skills: '["React","Next.js","TypeScript","Node.js","MongoDB","AWS"]', source: 'job_board' },
    // 18 - Siddharth Rao
    { id: 'seed-c-19', firstName: 'Siddharth', lastName: 'Rao', email: 'siddharth.rao@email.com', phone: '4695550110', locationCity: 'Mesquite', locationState: 'TX', visaStatus: 'stem_opt', currentEmployer: 'TCS', experienceYears: 2, salaryExpectation: 78000, skills: '["Java","Spring MVC","MySQL","jQuery","JSP"]', source: 'job_board' },
    // 19 - Kavitha Subramaniam
    { id: 'seed-c-20', firstName: 'Kavitha', lastName: 'Subramaniam', email: 'kavitha.s@email.com', phone: '5125550121', locationCity: 'Sugar Land', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'HCL Technologies', experienceYears: 8, salaryExpectation: 112000, skills: '["C#",".NET","WPF","SQL Server","Azure","Entity Framework"]', source: 'referral' },
    // 20 - Tushar Patil
    { id: 'seed-c-21', firstName: 'Tushar', lastName: 'Patil', email: 'tushar.patil@email.com', phone: '9725550132', locationCity: 'Pearland', locationState: 'TX', visaStatus: 'tn', currentEmployer: 'CIBC', experienceYears: 7, salaryExpectation: 125000, skills: '["AWS","Python","Lambda","DynamoDB","CloudFormation","Terraform"]', source: 'job_board' },
    // 21 - Ritika Joshi
    { id: 'seed-c-22', firstName: 'Ritika', lastName: 'Joshi', email: 'ritika.joshi@email.com', phone: '2145550143', locationCity: 'The Woodlands', locationState: 'TX', visaStatus: 'h1b', currentEmployer: 'Capgemini', experienceYears: 4, salaryExpectation: 95000, skills: '["React","TypeScript","Node.js","Express","MongoDB"]', source: 'job_board' },
  ]

  const candidates = await Promise.all(
    candidateData.map((data) =>
      prisma.candidate.upsert({
        where: { id: data.id },
        update: {},
        create: data as any,
      })
    )
  )

  console.log('✅ Candidates created')

  // ─── HELPER: create an application with staged notes ──────────────────────
  async function createApp(opts: {
    id: string
    jobId: string
    candidateId: string
    stage: string
    isProcessed: boolean
    recruiterId: string
    rejectionReason?: string
    progression: Array<{
      stageAtTime: string
      content: string
      authorId: string
      daysAgo: number
    }>
  }) {
    const existing = await prisma.application.findUnique({ where: { id: opts.id } })
    if (existing) return existing

    const app = await prisma.application.create({
      data: {
        id: opts.id,
        jobId: opts.jobId,
        candidateId: opts.candidateId,
        stage: opts.stage as any,
        isProcessed: opts.isProcessed,
        assignedRecruiterId: opts.recruiterId,
        rejectionReason: opts.rejectionReason,
      },
    })

    for (const step of opts.progression) {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - step.daysAgo)
      await prisma.note.create({
        data: {
          applicationId: app.id,
          authorId: step.authorId,
          content: step.content,
          stageAtTime: step.stageAtTime as any,
          isStageNote: true,
          createdAt,
        },
      })
    }

    return app
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 1 — Senior Java Developer
  // ══════════════════════════════════════════════════════════════════════════

  // App 1: Rahul Sharma — full pipeline → hired
  await createApp({
    id: 'seed-app-01', jobId: job1.id, candidateId: candidates[0].id,
    stage: 'hired', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 42, content: 'Strong resume. 6 years Java/Spring Boot, solid AWS experience. Moving him to screening.' },
      { stageAtTime: 'screened', authorId: recruiter.id, daysAgo: 38, content: 'Phone screen went very well. Communication is excellent, clearly understands microservices architecture. Moving to vetting.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 33, content: 'Technical vetting complete. Passed all Java coding questions. Salary expectation $105k is within budget. Scheduling interview.' },
      { stageAtTime: 'interview_scheduled', authorId: recruiter.id, daysAgo: 28, content: 'Interview confirmed for next Tuesday at 2 PM CST with the client engineering lead.' },
      { stageAtTime: 'interview_completed', authorId: recruiter.id, daysAgo: 21, content: 'Interview went great. Client says he was the strongest candidate. Submitting to client portal now.' },
      { stageAtTime: 'client_submitted', authorId: recruiter.id, daysAgo: 17, content: 'Submitted to client. Client scheduled an on-site for next week — great sign!' },
      { stageAtTime: 'client_interview', authorId: recruiter.id, daysAgo: 10, content: 'Client interview completed. Feedback: "impressed by his system design knowledge". Awaiting offer.' },
      { stageAtTime: 'offer_awaiting', authorId: manager.id, daysAgo: 6, content: 'Client approved the offer. $118k base + standard benefits. Preparing offer letter.' },
      { stageAtTime: 'offer_released', authorId: recruiter.id, daysAgo: 3, content: 'Offer accepted! Starting date set for Feb 24. Filing H1B transfer documents next week.' },
      { stageAtTime: 'h1b_filed', authorId: admin.id, daysAgo: 1, content: 'H1B transfer petition filed with premium processing. Rahul is officially hired. Great placement!' },
    ],
  })

  // App 2: Anil Kumar — at client_interview (deep in pipeline)
  await createApp({
    id: 'seed-app-02', jobId: job1.id, candidateId: candidates[2].id,
    stage: 'client_interview', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 30, content: 'Excellent profile — 8 yrs, Kafka, Kubernetes experience is exactly what the client needs.' },
      { stageAtTime: 'screened', authorId: recruiter.id, daysAgo: 26, content: 'Good call. Very articulate, understands distributed systems well. Moving forward.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 22, content: 'Coding challenge: passed all 3 problems. Kafka design question answered excellently. Scheduling interview.' },
      { stageAtTime: 'interview_scheduled', authorId: recruiter.id, daysAgo: 16, content: 'Interview confirmed for Monday 10 AM with Sr. Architect.' },
      { stageAtTime: 'interview_completed', authorId: recruiter.id, daysAgo: 10, content: 'Client is very interested. They want to do an on-site. Submitted profile to client portal.' },
      { stageAtTime: 'client_submitted', authorId: recruiter.id, daysAgo: 6, content: 'On-site scheduled for next Thursday at client HQ in downtown Dallas.' },
    ],
  })

  // App 3: Vikram Nair — at vetted stage
  await createApp({
    id: 'seed-app-03', jobId: job1.id, candidateId: candidates[4].id,
    stage: 'vetted', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 18, content: 'Good Java resume but mostly older stack (Hibernate/Struts). Worth screening to see if he is up to date.' },
      { stageAtTime: 'screened', authorId: recruiter.id, daysAgo: 14, content: 'Phone screen: he is current with Spring Boot 3. Mentioned recent project with Docker. Moving to vet.' },
    ],
  })

  // App 4: Ravi Teja — screened
  await createApp({
    id: 'seed-app-04', jobId: job1.id, candidateId: candidates[12].id,
    stage: 'screened', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 7, content: 'Strong Java background. 7 years at Infosys on microservices. Moving to phone screen.' },
    ],
  })

  // App 5: Suresh Babu — unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-05' },
    update: {},
    create: { id: 'seed-app-05', jobId: job1.id, candidateId: candidates[6].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: recruiter.id },
  })

  // App 6: Siddharth Rao — rejected early
  await createApp({
    id: 'seed-app-06', jobId: job1.id, candidateId: candidates[18].id,
    stage: 'rejected', isProcessed: true, recruiterId: recruiter.id,
    rejectionReason: 'Only 2 years experience, position requires 5+. Older Java stack, no cloud experience.',
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 12, content: 'Resume screened — unfortunately experience is too junior for this role. Rejecting at this stage.' },
    ],
  })

  // App 7: Lakshmi Narayanan — unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-07' },
    update: {},
    create: { id: 'seed-app-07', jobId: job1.id, candidateId: candidates[15].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: recruiter.id },
  })

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 2 — React Frontend Engineer
  // ══════════════════════════════════════════════════════════════════════════

  // App 8: Meera Singh — hired
  await createApp({
    id: 'seed-app-08', jobId: job2.id, candidateId: candidates[3].id,
    stage: 'hired', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 50, content: 'Fantastic portfolio. React projects look polished and well-structured. Screening immediately.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 46, content: 'Phone call: very enthusiastic, good cultural fit. Understands hooks and performance optimization. Vetted.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 40, content: 'Live coding challenge passed with flying colors. Component design was clean and reusable. Client will love her.' },
      { stageAtTime: 'interview_scheduled', authorId: sarah.id, daysAgo: 34, content: 'Client interview scheduled for Wednesday 3 PM via Zoom.' },
      { stageAtTime: 'interview_completed', authorId: sarah.id, daysAgo: 28, content: 'Client feedback: "best candidate we have seen". They want to move fast. Submitting now.' },
      { stageAtTime: 'client_submitted', authorId: sarah.id, daysAgo: 23, content: 'Submitted to client. They scheduled a follow-up call for Thursday.' },
      { stageAtTime: 'client_interview', authorId: sarah.id, daysAgo: 17, content: 'Second client interview done. They love her. Awaiting formal offer from their end.' },
      { stageAtTime: 'offer_awaiting', authorId: manager.id, daysAgo: 10, content: '$125k offer approved. Sending offer letter today.' },
      { stageAtTime: 'offer_released', authorId: sarah.id, daysAgo: 5, content: 'Offer accepted! Start date: March 3. Congratulations to Meera!' },
    ],
  })

  // App 9: Divya Reddy — at offer_released
  await createApp({
    id: 'seed-app-09', jobId: job2.id, candidateId: candidates[5].id,
    stage: 'offer_released', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 35, content: 'Next.js + GraphQL experience is a huge plus. Screened and moved forward.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 31, content: 'Good call. She has great design sense and knows Tailwind/Framer Motion. Moving to vetting.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 26, content: 'Take-home project submitted — excellent quality. Client-ready profile.' },
      { stageAtTime: 'interview_scheduled', authorId: sarah.id, daysAgo: 20, content: 'Client interview confirmed for Monday at 1 PM.' },
      { stageAtTime: 'interview_completed', authorId: sarah.id, daysAgo: 15, content: 'Client interview positive. They want to do a final round with the CTO.' },
      { stageAtTime: 'client_submitted', authorId: sarah.id, daysAgo: 12, content: 'CTO call scheduled for Friday.' },
      { stageAtTime: 'client_interview', authorId: sarah.id, daysAgo: 8, content: 'CTO interview done. "Very impressed by her architecture knowledge." Offer being prepared.' },
      { stageAtTime: 'offer_awaiting', authorId: manager.id, daysAgo: 3, content: '$130k offer extended. Waiting on candidate response — she is negotiating notice period.' },
    ],
  })

  // App 10: Priya Patel — at interview_completed
  await createApp({
    id: 'seed-app-10', jobId: job2.id, candidateId: candidates[1].id,
    stage: 'interview_completed', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 25, content: 'Solid React + TypeScript portfolio. OPT visa with STEM extension eligible. Moving to screen.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 21, content: 'Great phone screen. Understands React Query, performance optimization, and testing. Moving to vet.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 15, content: 'Coding challenge: excellent component design. Ready for client interview.' },
      { stageAtTime: 'interview_scheduled', authorId: sarah.id, daysAgo: 10, content: 'Client interview scheduled for last Friday at 10 AM.' },
    ],
  })

  // App 11: Ananya Bose — at client_submitted
  await createApp({
    id: 'seed-app-11', jobId: job2.id, candidateId: candidates[17].id,
    stage: 'client_submitted', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 20, content: 'GC holder with Next.js and Node.js background. Strong full-stack profile. Screening.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 16, content: 'Phone screen: excellent communication. Freelance projects are impressive. Moving to vet.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 11, content: 'Live coding passed. Built a complete mini-app in 45 min. Submitting to client.' },
      { stageAtTime: 'interview_scheduled', authorId: sarah.id, daysAgo: 7, content: 'Client interview completed yesterday. Waiting for client feedback.' },
    ],
  })

  // App 12: Sneha Kulkarni — unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-12' },
    update: {},
    create: { id: 'seed-app-12', jobId: job2.id, candidateId: candidates[13].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: sarah.id },
  })

  // App 13: Ritika Joshi — unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-13' },
    update: {},
    create: { id: 'seed-app-13', jobId: job2.id, candidateId: candidates[21].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: sarah.id },
  })

  // App 14: Nisha Gupta — rejected
  await createApp({
    id: 'seed-app-14', jobId: job2.id, candidateId: candidates[7].id,
    stage: 'rejected', isProcessed: true, recruiterId: sarah.id,
    rejectionReason: 'Only 1 year experience, role requires 3+. Portfolio too thin for client expectations.',
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 15, content: 'Reviewed resume — experience is unfortunately too limited. Only 1 year post-grad. Rejecting.' },
    ],
  })

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 3 — DevOps / Cloud Engineer
  // ══════════════════════════════════════════════════════════════════════════

  // App 15: Arjun Menon — offer_awaiting (deep pipeline)
  await createApp({
    id: 'seed-app-15', jobId: job3.id, candidateId: candidates[8].id,
    stage: 'offer_awaiting', isProcessed: true, recruiterId: mike.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: mike.id, daysAgo: 38, content: '9 years AWS + Terraform + Kubernetes. This is exactly the profile our client asked for. Screening immediately.' },
      { stageAtTime: 'screened', authorId: mike.id, daysAgo: 34, content: 'Called him — very senior mindset. Knows IaC patterns well. Has managed 500+ node clusters. Moving to vet.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 28, content: 'Technical deep-dive with our architect: passed all cloud design scenarios. Cost optimization knowledge is outstanding.' },
      { stageAtTime: 'interview_scheduled', authorId: mike.id, daysAgo: 22, content: 'Client interview scheduled for next Monday with their VP of Infrastructure.' },
      { stageAtTime: 'interview_completed', authorId: mike.id, daysAgo: 16, content: 'Interview feedback: "exactly what we need". Client wants to move to on-site final round.' },
      { stageAtTime: 'client_submitted', authorId: mike.id, daysAgo: 12, content: 'On-site at client HQ completed. Panel of 4 engineers, all gave thumbs up.' },
      { stageAtTime: 'client_interview', authorId: mike.id, daysAgo: 6, content: 'Client verbal offer given — $140k. Formal offer letter expected by end of this week.' },
    ],
  })

  // App 16: Rohan Desai — at interview_scheduled
  await createApp({
    id: 'seed-app-16', jobId: job3.id, candidateId: candidates[16].id,
    stage: 'interview_scheduled', isProcessed: true, recruiterId: mike.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: mike.id, daysAgo: 22, content: 'Strong AWS + Azure dual cloud experience. Very relevant for this hybrid client environment.' },
      { stageAtTime: 'screened', authorId: mike.id, daysAgo: 18, content: 'Good phone screen. He has done Jenkins-to-GitHub Actions migrations before which is key.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 12, content: 'Technical assessment passed. Terraform module design was clean. Scheduling client interview.' },
    ],
  })

  // App 17: Tushar Patil — at screened
  await createApp({
    id: 'seed-app-17', jobId: job3.id, candidateId: candidates[20].id,
    stage: 'screened', isProcessed: true, recruiterId: mike.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: mike.id, daysAgo: 10, content: 'TN visa, serverless AWS specialist. Budget is tight but profile is very strong. Screening now.' },
    ],
  })

  // App 18: Unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-18' },
    update: {},
    create: { id: 'seed-app-18', jobId: job3.id, candidateId: candidates[9].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: mike.id },
  })

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 4 — Full Stack Python Developer
  // ══════════════════════════════════════════════════════════════════════════

  // App 19: Pooja Iyer — at client_interview
  await createApp({
    id: 'seed-app-19', jobId: job4.id, candidateId: candidates[9].id,
    stage: 'client_interview', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 28, content: 'GC holder, Python/Django/React full stack. Perfect match for this role.' },
      { stageAtTime: 'screened', authorId: recruiter.id, daysAgo: 24, content: 'Excellent phone screen. Built Django REST APIs at scale, knows React hooks deeply.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 18, content: 'Take-home: full CRUD app with auth, tests, and Docker. Impressive quality. Client-ready.' },
      { stageAtTime: 'interview_scheduled', authorId: recruiter.id, daysAgo: 12, content: 'Client Zoom interview done. They loved her. Scheduling an on-site follow-up.' },
      { stageAtTime: 'interview_completed', authorId: recruiter.id, daysAgo: 8, content: 'Submitted to client system. On-site scheduled for this Friday.' },
    ],
  })

  // App 20: Manish Verma — at vetted
  await createApp({
    id: 'seed-app-20', jobId: job4.id, candidateId: candidates[14].id,
    stage: 'vetted', isProcessed: true, recruiterId: recruiter.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: recruiter.id, daysAgo: 15, content: 'US Citizen, FastAPI + React. Salary expectation fits budget. Moving to screen.' },
      { stageAtTime: 'screened', authorId: recruiter.id, daysAgo: 11, content: 'Good phone screen. Has worked with Celery/Redis background jobs which is a plus.' },
    ],
  })

  // App 21: Unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-21' },
    update: {},
    create: { id: 'seed-app-21', jobId: job4.id, candidateId: candidates[7].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: recruiter.id },
  })

  // ══════════════════════════════════════════════════════════════════════════
  // JOB 5 — .NET / C# Developer
  // ══════════════════════════════════════════════════════════════════════════

  // App 22: Kiran Shah — at h1b_filed
  await createApp({
    id: 'seed-app-22', jobId: job5.id, candidateId: candidates[10].id,
    stage: 'h1b_filed', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 55, content: 'Strong .NET 6 + Azure profile. 6 years FinTech experience is ideal for this client.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 51, content: 'Phone screen: excellent. Understands SOLID principles and microservices in .NET very well.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 45, content: 'Code review exercise passed. Clean architecture, proper DI, good unit test coverage.' },
      { stageAtTime: 'interview_scheduled', authorId: sarah.id, daysAgo: 39, content: 'Client interview with lead architect confirmed for next Wednesday.' },
      { stageAtTime: 'interview_completed', authorId: sarah.id, daysAgo: 32, content: 'Interview: very strong. Client said "hire him". Submitting formal profile.' },
      { stageAtTime: 'client_submitted', authorId: sarah.id, daysAgo: 28, content: 'On-site interview completed. All panels gave positive feedback. Waiting on offer.' },
      { stageAtTime: 'client_interview', authorId: sarah.id, daysAgo: 20, content: 'Offer approved: $120k. Offer letter signed and returned.' },
      { stageAtTime: 'offer_awaiting', authorId: manager.id, daysAgo: 14, content: 'Offer released and accepted. H1B transfer required — filing this week.' },
      { stageAtTime: 'offer_released', authorId: admin.id, daysAgo: 7, content: 'H1B petition filed with USCIS. Premium processing selected. Expected approval: 15 business days.' },
    ],
  })

  // App 23: Deepa Krishnamurthy — at interview_scheduled
  await createApp({
    id: 'seed-app-23', jobId: job5.id, candidateId: candidates[11].id,
    stage: 'interview_scheduled', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 20, content: 'STEM OPT, .NET Core experience from Accenture. Good fit. Moving to screen.' },
      { stageAtTime: 'screened', authorId: sarah.id, daysAgo: 16, content: 'Good call. She has Azure DevOps pipeline experience which is critical for this role.' },
      { stageAtTime: 'vetted', authorId: manager.id, daysAgo: 10, content: 'Passed technical assessment. Client interview set for next week Thursday.' },
    ],
  })

  // App 24: Kavitha Subramaniam — at screened
  await createApp({
    id: 'seed-app-24', jobId: job5.id, candidateId: candidates[19].id,
    stage: 'screened', isProcessed: true, recruiterId: sarah.id,
    progression: [
      { stageAtTime: 'resume_received', authorId: sarah.id, daysAgo: 8, content: 'H1B, 8 years .NET including WPF and Entity Framework. Referral from Kavitha herself. Screening.' },
    ],
  })

  // App 25: Unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-25' },
    update: {},
    create: { id: 'seed-app-25', jobId: job5.id, candidateId: candidates[18].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: sarah.id },
  })

  // App 26: Unprocessed
  await prisma.application.upsert({
    where: { id: 'seed-app-26' },
    update: {},
    create: { id: 'seed-app-26', jobId: job5.id, candidateId: candidates[15].id, stage: 'resume_received', isProcessed: false, assignedRecruiterId: sarah.id },
  })

  console.log('✅ Applications and notes created')

  // ─── Audit Logs (sample) ──────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { entityType: 'application', entityId: 'seed-app-01', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'resume_received' }), newValue: JSON.stringify({ stage: 'screened' }), performedById: recruiter.id },
      { entityType: 'application', entityId: 'seed-app-01', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'screened' }), newValue: JSON.stringify({ stage: 'vetted' }), performedById: recruiter.id },
      { entityType: 'application', entityId: 'seed-app-01', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'vetted' }), newValue: JSON.stringify({ stage: 'interview_scheduled' }), performedById: manager.id },
      { entityType: 'application', entityId: 'seed-app-01', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'offer_released' }), newValue: JSON.stringify({ stage: 'h1b_filed' }), performedById: admin.id },
      { entityType: 'application', entityId: 'seed-app-08', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'offer_awaiting' }), newValue: JSON.stringify({ stage: 'offer_released' }), performedById: sarah.id },
      { entityType: 'application', entityId: 'seed-app-22', action: 'stage_changed', oldValue: JSON.stringify({ stage: 'offer_released' }), newValue: JSON.stringify({ stage: 'h1b_filed' }), performedById: admin.id },
    ],
  })

  console.log('✅ Audit logs created')
  console.log('')
  console.log('🎉 Seed complete! 22 candidates, 6 jobs, 26 applications')
  console.log('   Admin:     admin@atobs.com / admin123')
  console.log('   Recruiter: recruiter@atobs.com / recruiter123')
  console.log('   Manager:   manager@atobs.com / manager123')
  console.log('   Sarah:     sarah@atobs.com / sarah123')
  console.log('   Mike:      mike@atobs.com / mike123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
