
import { Link } from 'react-router-dom';
import { BarChart2, Map, Droplets, Users, Mail, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const teamMembers = [
  {
    name: 'Dr. Somchai Watanabe',
    role: 'Project Director',
    image: 'https://randomuser.me/api/portraits/men/41.jpg',
    bio: 'Dr. Watanabe has 15 years of experience in water resource management and environmental conservation.',
  },
  {
    name: 'Niran Thepsiri',
    role: 'Technical Lead',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Niran manages our network of monitoring stations and ensures data accuracy across all measurements.',
  },
  {
    name: 'Pranee Chaisri',
    role: 'Community Outreach',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Pranee coordinates with local communities to promote river conservation and sustainable water use.',
  },
  {
    name: 'Wanchai Phongam',
    role: 'Data Analyst',
    image: 'https://randomuser.me/api/portraits/men/22.jpg',
    bio: 'Wanchai specializes in water quality data analysis and predictive modeling for early warning systems.',
  },
];

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">About the Kham River Monitoring Project</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Protecting our vital water resources through technology, data, and community engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 mb-6">
                The Kham River Monitoring Project was established in 2022 with a clear mission: to protect and preserve the water quality of the Kham River basin through continuous monitoring, data-driven insights, and community action.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our network of automated monitoring stations provides real-time data on critical water quality parameters, enabling early detection of pollution events and long-term tracking of environmental trends.
              </p>
              <p className="text-lg text-gray-700">
                Through partnerships with local communities, government agencies, and educational institutions, we're working to ensure the Kham River remains a healthy ecosystem for generations to come.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzZWFyY2glMjBsYWJ8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60" 
                alt="Kham River Monitoring Project"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What We Do</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-blue-600">
                <Droplets className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Water Quality Monitoring</h3>
              <p className="text-gray-600">
                Our network of automated stations continuously measures key water quality parameters including pH, temperature, turbidity, and dissolved oxygen.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-blue-600">
                <BarChart2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Data Analysis</h3>
              <p className="text-gray-600">
                We analyze water quality data to identify trends, detect anomalies, and provide early warnings of potential pollution events.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-blue-600">
                <Map className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Watershed Mapping</h3>
              <p className="text-gray-600">
                We map the Kham River watershed to understand land use patterns and identify potential sources of pollution.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4 text-blue-600">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community Engagement</h3>
              <p className="text-gray-600">
                We work with local communities to raise awareness about river health and promote sustainable water use practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-blue-600 mb-4">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Partners</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Partner logos would go here - using placeholders */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
                <div className="h-16 w-32 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  Partner Logo
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
              <p className="text-blue-200 mb-8">
                Have questions about our monitoring project? Want to get involved or report a water quality issue?
                Reach out to our team.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold">Email</h3>
                    <p className="text-blue-200">contact@khamriver.org</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold">Phone</h3>
                    <p className="text-blue-200">+66 123 4567</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Map className="h-6 w-6 text-blue-300 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold">Address</h3>
                    <p className="text-blue-200">123 River Road, Chiang Mai, Thailand</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-700 p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-6">Get Involved</h3>
              <p className="mb-6">
                There are many ways to support our mission and help protect the Kham River:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-xs">1</span>
                  </div>
                  <span>Volunteer for water sampling and monitoring activities</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-xs">2</span>
                  </div>
                  <span>Report pollution incidents or unusual water conditions</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-xs">3</span>
                  </div>
                  <span>Participate in river cleanup events and conservation activities</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-white text-xs">4</span>
                  </div>
                  <span>Support our work through donations or sponsorships</span>
                </li>
              </ul>
              <Button asChild size="lg" className="w-full">
                <Link to="#">
                  Contact Us
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
