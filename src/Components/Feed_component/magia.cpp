#include<bits/stdc++.h>
using namespace std;
int main()
{
    int c=51;
    while(c--)
    {
        string s;
        getline(cin,s);
        cout<<"<a class=\"dropdown-item\" value=\""<<s.substr(0,2)<<"\">"<<s.substr(5)<<"</a>"<<endl;
    }
    return 0;
}