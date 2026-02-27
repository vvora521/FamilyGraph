import { runWrite } from './driver'
import { randomUUID } from 'crypto'

export async function seedDatabase() {
  const now = new Date().toISOString()

  // Generation 1 (Great-grandparents)
  const greatGrandpa = { id: randomUUID(), name: 'Heinrich Mueller', birthDate: '1890-03-15', deathDate: '1965-07-22', gender: 'male', bio: 'German immigrant who settled in Ohio in 1910.', birthPlace: 'Bavaria, Germany', createdAt: now, updatedAt: now, archived: false }
  const greatGrandma = { id: randomUUID(), name: 'Rosa Mueller', birthDate: '1893-09-02', deathDate: '1970-01-14', gender: 'female', bio: 'Seamstress and homemaker.', birthPlace: 'Bavaria, Germany', createdAt: now, updatedAt: now, archived: false }

  // Generation 2 (Grandparents)
  const grandpa1 = { id: randomUUID(), name: 'Walter Mueller', birthDate: '1918-05-10', deathDate: '1989-11-03', gender: 'male', bio: 'WWII veteran, worked in manufacturing.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }
  const grandma1 = { id: randomUUID(), name: 'Dorothy Mueller', birthDate: '1921-02-28', deathDate: '2005-04-12', gender: 'female', bio: 'School teacher for 30 years.', birthPlace: 'Cleveland, Ohio', createdAt: now, updatedAt: now, archived: false }
  const grandpa2 = { id: randomUUID(), name: 'James Harrison', birthDate: '1920-08-17', deathDate: '1982-06-05', gender: 'male', bio: 'Farmer and community leader.', birthPlace: 'Springfield, Illinois', createdAt: now, updatedAt: now, archived: false }
  const grandma2 = { id: randomUUID(), name: 'Margaret Harrison', birthDate: '1923-11-22', deathDate: '2010-09-30', gender: 'female', bio: 'Nurse during the Korean War era.', birthPlace: 'Chicago, Illinois', createdAt: now, updatedAt: now, archived: false }

  // Generation 3 (Parents)
  const father = { id: randomUUID(), name: 'Robert Mueller', birthDate: '1948-07-04', deathDate: null, gender: 'male', bio: 'Engineer, loves woodworking.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }
  const mother = { id: randomUUID(), name: 'Susan Mueller', birthDate: '1950-12-19', deathDate: null, gender: 'female', bio: 'Artist and community volunteer.', birthPlace: 'Springfield, Illinois', createdAt: now, updatedAt: now, archived: false }
  const uncle = { id: randomUUID(), name: 'Thomas Mueller', birthDate: '1952-04-23', deathDate: null, gender: 'male', bio: 'Retired police officer.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }
  const aunt = { id: randomUUID(), name: 'Patricia Harrison-Lee', birthDate: '1955-08-11', deathDate: null, gender: 'female', bio: 'Professor of History.', birthPlace: 'Chicago, Illinois', createdAt: now, updatedAt: now, archived: false }

  // Generation 4 (Children)
  const child1 = { id: randomUUID(), name: 'Emily Mueller', birthDate: '1975-03-20', deathDate: null, gender: 'female', bio: 'Software engineer at a tech startup.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }
  const child2 = { id: randomUUID(), name: 'Michael Mueller', birthDate: '1978-09-14', deathDate: null, gender: 'male', bio: 'Physician, married with two kids.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }
  const child3 = { id: randomUUID(), name: 'Jessica Mueller', birthDate: '1982-01-07', deathDate: null, gender: 'female', bio: 'Graphic designer and traveler.', birthPlace: 'Columbus, Ohio', createdAt: now, updatedAt: now, archived: false }

  // Places
  const bavaria = { id: randomUUID(), name: 'Bavaria, Germany', latitude: 48.7904, longitude: 11.4979, country: 'Germany', region: 'Bavaria', createdAt: now }
  const columbus = { id: randomUUID(), name: 'Columbus, Ohio', latitude: 39.9612, longitude: -82.9988, country: 'USA', region: 'Ohio', createdAt: now }
  const springfield = { id: randomUUID(), name: 'Springfield, Illinois', latitude: 39.7817, longitude: -89.6501, country: 'USA', region: 'Illinois', createdAt: now }

  // Events
  const immigration = { id: randomUUID(), title: 'Immigration to America', description: 'Heinrich and Rosa Mueller immigrated from Bavaria to Columbus, Ohio.', date: '1910-06-15', eventType: 'migration', createdAt: now, archived: false }
  const wwii = { id: randomUUID(), title: 'WWII Service', description: 'Walter Mueller served in the US Army during WWII in the Pacific Theater.', date: '1942-01-01', eventType: 'military', createdAt: now, archived: false }
  const wedding1 = { id: randomUUID(), title: 'Mueller-Harrison Wedding', description: 'Robert Mueller married Susan Harrison in Columbus, Ohio.', date: '1974-06-21', eventType: 'marriage', createdAt: now, archived: false }

  // Cypher to create all nodes
  await runWrite(`
    CREATE (gg1:Person $gg1Props)
    CREATE (gg2:Person $gg2Props)
    CREATE (gp1:Person $gp1Props)
    CREATE (gm1:Person $gm1Props)
    CREATE (gp2:Person $gp2Props)
    CREATE (gm2:Person $gm2Props)
    CREATE (f:Person $fProps)
    CREATE (m:Person $mProps)
    CREATE (u:Person $uProps)
    CREATE (a:Person $aProps)
    CREATE (c1:Person $c1Props)
    CREATE (c2:Person $c2Props)
    CREATE (c3:Person $c3Props)
    CREATE (pb:Place $pbProps)
    CREATE (pc:Place $pcProps)
    CREATE (ps:Place $psProps)
    CREATE (ev1:Event $ev1Props)
    CREATE (ev2:Event $ev2Props)
    CREATE (ev3:Event $ev3Props)
    // Marriages
    CREATE (gg1)-[:MARRIED_TO]->(gg2)
    CREATE (gg2)-[:MARRIED_TO]->(gg1)
    CREATE (gp1)-[:MARRIED_TO]->(gm1)
    CREATE (gm1)-[:MARRIED_TO]->(gp1)
    CREATE (gp2)-[:MARRIED_TO]->(gm2)
    CREATE (gm2)-[:MARRIED_TO]->(gp2)
    CREATE (f)-[:MARRIED_TO]->(m)
    CREATE (m)-[:MARRIED_TO]->(f)
    // Parent-child (gen 1 -> gen 2)
    CREATE (gg1)-[:PARENT_OF]->(gp1)
    CREATE (gp1)-[:CHILD_OF]->(gg1)
    CREATE (gg2)-[:PARENT_OF]->(gp1)
    CREATE (gp1)-[:CHILD_OF]->(gg2)
    // Parent-child (gen 2 -> gen 3)
    CREATE (gp1)-[:PARENT_OF]->(f)
    CREATE (f)-[:CHILD_OF]->(gp1)
    CREATE (gm1)-[:PARENT_OF]->(f)
    CREATE (f)-[:CHILD_OF]->(gm1)
    CREATE (gp1)-[:PARENT_OF]->(u)
    CREATE (u)-[:CHILD_OF]->(gp1)
    CREATE (gm1)-[:PARENT_OF]->(u)
    CREATE (u)-[:CHILD_OF]->(gm1)
    CREATE (gp2)-[:PARENT_OF]->(m)
    CREATE (m)-[:CHILD_OF]->(gp2)
    CREATE (gm2)-[:PARENT_OF]->(m)
    CREATE (m)-[:CHILD_OF]->(gm2)
    CREATE (gp2)-[:PARENT_OF]->(a)
    CREATE (a)-[:CHILD_OF]->(gp2)
    CREATE (gm2)-[:PARENT_OF]->(a)
    CREATE (a)-[:CHILD_OF]->(gm2)
    // Parent-child (gen 3 -> gen 4)
    CREATE (f)-[:PARENT_OF]->(c1)
    CREATE (c1)-[:CHILD_OF]->(f)
    CREATE (m)-[:PARENT_OF]->(c1)
    CREATE (c1)-[:CHILD_OF]->(m)
    CREATE (f)-[:PARENT_OF]->(c2)
    CREATE (c2)-[:CHILD_OF]->(f)
    CREATE (m)-[:PARENT_OF]->(c2)
    CREATE (c2)-[:CHILD_OF]->(m)
    CREATE (f)-[:PARENT_OF]->(c3)
    CREATE (c3)-[:CHILD_OF]->(f)
    CREATE (m)-[:PARENT_OF]->(c3)
    CREATE (c3)-[:CHILD_OF]->(m)
    // Events
    CREATE (gg1)-[:PARTICIPATED_IN]->(ev1)
    CREATE (gg2)-[:PARTICIPATED_IN]->(ev1)
    CREATE (ev1)-[:OCCURS_AT]->(pb)
    CREATE (gp1)-[:PARTICIPATED_IN]->(ev2)
    CREATE (f)-[:PARTICIPATED_IN]->(ev3)
    CREATE (m)-[:PARTICIPATED_IN]->(ev3)
    CREATE (ev3)-[:OCCURS_AT]->(pc)
    // Birth places
    CREATE (gg1)-[:LIVES_AT]->(pb)
    CREATE (gg2)-[:LIVES_AT]->(pb)
    CREATE (gp1)-[:LIVES_AT]->(pc)
    CREATE (gm1)-[:LIVES_AT]->(pc)
    CREATE (f)-[:LIVES_AT]->(pc)
    CREATE (m)-[:LIVES_AT]->(ps)
  `, {
    gg1Props: greatGrandpa, gg2Props: greatGrandma,
    gp1Props: grandpa1, gm1Props: grandma1,
    gp2Props: grandpa2, gm2Props: grandma2,
    fProps: father, mProps: mother, uProps: uncle, aProps: aunt,
    c1Props: child1, c2Props: child2, c3Props: child3,
    pbProps: bavaria, pcProps: columbus, psProps: springfield,
    ev1Props: immigration, ev2Props: wwii, ev3Props: wedding1
  })

  console.log('Seed data created successfully!')
}
