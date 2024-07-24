import Mongoose from "mongoose";

const express = require("express");
const mongoose = require("mongoose");
const birthday = require("../dist/models/birthday");


const app = express();

const mongodbConnectLink="mongodb+srv://swarajrupadhyay:EupyKwXaBs4@clusterbirthday.9jailnj.mongodb.net/birthday_database?retryWrites=true&w=majority&appName=ClusterBirthday";
mongoose.connect(mongodbConnectLink)
 .then( () =>  console.log("connected to the database"))
 .catch((error: any) => console.log(error));

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

app.listen(3000);

interface birthdayObject {
    _id:Mongoose.Types.ObjectId,
    person:string,
    birthdayDate:Date,
    createdAt:Date,
    updatedAt:Date,
    __v:number
}

app.get('/', (req:any,res: { render: (arg0: string, arg1: { birthdays: birthdayObject[]; }) => void; }) => {
    birthday.find().sort({createdAt: -1})
    .then((result:birthdayObject[]) => {
        res.render("index", {birthdays: result});
    })
    .catch((error: any) => console.log(error));
})

app.get('/create', (req: any,res: { render: (arg0: string) => void; })=> {
    res.render("create");
})

app.post('/create', (req: { body: { birthdayDate: Date; person: string; }; },res: { redirect: (arg0: string) => void; })=>{
    const DOB = req.body.birthdayDate;
    const date = new Date(DOB);
   
    
    const newBirthday = new birthday({
        person: req.body.person,
        birthdayDate: date
    });
     
    newBirthday.save()
    .then(() => {
        res.redirect('/');
    })
    .catch((err:any) => console.log(err));
})

app.delete('/birthday/:id', (req : { params : { id: string }},res: { json: (arg0: {redirect: string}) => void}) => {
    const id= req.params.id;

    birthday.findByIdAndDelete(id)
    .then(() => {
        res.json({redirect: "/"});
    })
    .catch((err:any) => console.log(err));
})

app.get('/update/:id', (req: { params: { id: any; }; },res: { render: (arg0: string, arg1: { birthday: any; birthdayDate: any; }) => void; }) => {
    const id=req.params.id;

    birthday.findById(id)
    .then((result:birthdayObject) => {
        const birthdayDate = result.birthdayDate;
        const dateOnly = birthdayDate.toLocaleDateString();
        res.render("update", {birthday: result , birthdayDate: dateOnly});
    })
   .catch((err:any) =>  console.log(err));
})

app.post('/update/:id', (req: { params: { id: any; }; body: { presentBirthdayDate: any; }; },res: { redirect: (arg0: string) => void; }) => {
    const id= req.params.id;
    const DOB = req.body.presentBirthdayDate;
    const date = new Date(DOB);

    birthday.findByIdAndUpdate(id, { birthdayDate: date}, { new:true , runValidators:true})
    .then(()=> {
       res.redirect('/');
    })
    .catch((err:any) => console.log(err));
})

app.get('/search', (req: any,res: { render: (arg0: string) => void; }) =>{
    res.render("search");
})

app.post('/search', (req: any,res: { redirect: (arg0: string) => void; }) => {
    birthday.findOne({person:"Swaraj Upadhyay"})
    .then((result:birthdayObject) => {
        res.redirect(`/search/${result._id}`)
    })
})

app.get("/search/:id",(req: { params: { id: any; }; },res: { render: (arg0: string, arg1: { birthday: any; birthdayDate: any; }) => void; })=> {
    const id = req.params.id;
    birthday.findById(id)
    .then((result:birthdayObject) => {
        const DOB = result.birthdayDate;
        const onlyDate = DOB.toLocaleDateString();
        res.render("searched", {birthday:result , birthdayDate: onlyDate});
    })
    .catch((err:any) => console.log(err));
})

app.get("/closest_b'day", (req: any,res: { render: (arg0: string, arg1: { birthdays: any; }) => void; }) => {
    const currentDate = new Date();
    birthday.find()
    .then((results:birthdayObject[]) => {
        let collectedDates:Date[] = [];
        let counterMonth:number[] = [];
        let minMonth = Infinity;
        results.forEach(result => {
            const DOB =  result.birthdayDate;
            if(Math.abs(currentDate.getMonth() - DOB.getMonth()) < minMonth)
            {
                minMonth = Math.abs(currentDate.getMonth() - DOB.getMonth());
                counterMonth = [];
                collectedDates = [];
                counterMonth.push(DOB.getMonth() + 1);
                collectedDates.push(DOB);
            }
            else if(Math.abs(currentDate.getMonth() - DOB.getMonth()) === minMonth)
            {
                counterMonth.push(DOB.getMonth() + 1);
                collectedDates.push(DOB);
            }
        });
        if(counterMonth.length === 1)
        {
            const closestFoundBirthday = collectedDates[0];
            birthday.find({birthdayDate: closestFoundBirthday})
            .then((result:birthdayObject[]) => {
                res.render("closest", {birthdays: result});
            })
            .catch((error:any) => console.log(error));
        }
        else if(counterMonth.length > 1)
        {
            if(counterMonth[0] === (currentDate.getMonth() + 1) )
            {
                let minDay = Infinity
                let counter:Date[] = [];
                collectedDates.forEach(collectedDate => {
                    if(collectedDate.getDate() - currentDate.getDate() > 0)
                    {
                        if(collectedDate.getDate() - currentDate.getDate() < minDay)
                        {
                            minDay = collectedDate.getDate() - currentDate.getDate();
                            counter=[];
                            counter.push(collectedDate);
                        }
                        else if(collectedDate.getDate() - currentDate.getDate() === minDay)
                        {
                            counter.push(collectedDate);
                        }
                    }
                })
                let foundDates:birthdayObject[] = [];
                const promises = counter.map(counterDate => {
                return birthday.findOne({ birthdayDate: counterDate })
                    .then((result:birthdayObject) => {
                    foundDates.push(result);
                    })
                    .catch((error:any) => console.log(error));
                });

                Promise.all(promises)
                .then(() => {
                    res.render("closest", {birthdays: foundDates});
                    console.log("page rendered same month", counterMonth, counterMonth.length);
                })
                .catch(error => console.log(error));
            }
            else{
                let minDay = Infinity
                let counter:Date[] = [];
                collectedDates.forEach(collectedDate => {
                        if(collectedDate.getDate() - 1 < minDay)
                        {
                            minDay = collectedDate.getDate() -1;
                            counter=[];
                            counter.push(collectedDate);
                        }
                        else if(collectedDate.getDate() - 1 === minDay)
                        {
                            counter.push(collectedDate);
                        }
                    })
                let foundDates:birthdayObject[] = [];
                const promises = counter.map(counterDate => {
                return birthday.findOne({ birthdayDate: counterDate })
                    .then((result:birthdayObject) => {
                    foundDates.push(result);
                    })
                    .catch((error:any) => console.log(error));
                });
    
                Promise.all(promises)
                .then(() => {
                    res.render("closest", {birthdays: foundDates});
                    console.log("page rendered")
                })
                .catch(error => console.log(error));
            }
        }
    })
    .catch((err:any) => console.log(err));
})