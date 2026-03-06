const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jokcixazvunvwojwzied.supabase.co';
const supabaseKey = 'sb_publishable_6y_uDr6-tw7Ys-CS7iZFHg_-r7VFSh2'; // Anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(username, password) {
    const email = username.includes('@') ? username : `${username}@f1.local`;
    console.log(`Testing login for: ${username} (as ${email})`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login failed:', error.message);
    } else {
        console.log('Login successful! User ID:', data.user.id);
    }
}

async function runTests() {
    // Test successful login
    await testLogin('braganca', 'fantasyf1');

    // Test failed login
    await testLogin('wronguser', 'wrongpass');
}

runTests();
