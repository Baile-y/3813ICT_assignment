const { MongoClient, ObjectId } = require('mongodb');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server'); // Assuming 'app' is exported from your server
const expect = chai.expect;

chai.use(chaiHttp);

let db;
let userId;
let superAdminId;

// Test suite for user routes
describe('User Routes', () => {

  before(async () => {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    db = client.db('mydb'); // Use 'mydb' database
    app.locals.db = db;
  });

  beforeEach(async () => {
    // Insert a test user
    const user = await db.collection('users').insertOne({
      username: 'super',
      password: '123',
      roles: ['super-admin'],
      avatar: 'uploads/profile-images/default.jpg',
    });

    superAdminId = user.insertedId;
  });

  afterEach(async () => {
    // Clean up after each test
    await db.collection('users').deleteMany({});
  });

  after(async () => {
    await db.dropDatabase(); // Drop the test database after all tests are done
  });

  // Test for registering a new user
  it('should register a new user', (done) => {
    chai.request(app)
      .post('/api/users/register')
      .send({ username: 'newuser', password: 'password123' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        expect(res.body.user).to.have.property('username', 'newuser');
        done();
      });
  });

  // Test for logging in an existing user
  it('should log in an existing user', (done) => {
    chai.request(app)
      .post('/api/users/login')
      .send({ username: 'super', password: '123' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        expect(res.body.user).to.have.property('username', 'super');
        done();
      });
  });

  // Test for promoting a user to Group Admin
  it('should promote a user to Group Admin', async () => {
    const user = await db.collection('users').insertOne({ username: 'testuser', roles: ['user'] });
    const res = await chai.request(app)
      .post('/api/users/promote')
      .set('user-roles', JSON.stringify(['super-admin']))
      .set('user-id', superAdminId.toString())
      .send({ userId: user.insertedId.toString(), newRole: 'group-admin' });
    
    expect(res).to.have.status(200);
    expect(res.body.success).to.be.true;
  });
  

  // Test for deleting a user by the user themselves
  it('should allow a user to delete themselves', (done) => {
    chai.request(app)
      .delete(`/api/users/delete/${superAdminId}`)
      .set('user-id', superAdminId.toString())
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        done();
      });
  });

  // Test for fetching all users (Super Admin access)
  it('should fetch all users', (done) => {
    chai.request(app)
      .get('/api/users/all')
      .set('user-roles', JSON.stringify(['super-admin']))
      .set('user-id', superAdminId.toString())
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array').that.is.not.empty;
        done();
      });
  });

  // Test for promoting a user to Super Admin
  it('should promote a user to Super Admin', async () => {
    const user = await db.collection('users').insertOne({ username: 'testuser', roles: ['user'] });
    const res = await chai.request(app)
      .post('/api/users/promote-to-superadmin')
      .set('user-roles', JSON.stringify(['super-admin']))
      .set('user-id', superAdminId.toString())
      .send({ userId: user.insertedId.toString() });
  
    expect(res).to.have.status(200);
    expect(res.body.success).to.be.true;
  });
  
});
