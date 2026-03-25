Hướng dẫn chạy quiz -- dành cho learner thuộc khóa học Bootcamp web development 2023 



* Upzip file TTS updated 
* Thay đổi đường dẫn file env trong file cat\_service\_api.py

ENV\_PATH = Path(r"C:\\Users\\ADMIN\\Documents\\Project\\FlyUpProject\\backend\\.env")

* Chạy file cat\_service\_api.py với command 

python "c:\\Users\\ADMIN\\Documents\\NetBeansProjects\\TTS\\TTS\\cat\_service\_api.py" -- đường dẫn sẽ khác 

* Xác nhận api đã được chạy ở port 5001



\-- Test API Postman

POST: http://127.0.0.1:5001/api/cat/next-question

JSON body:

&#x20;   { 

&#x20;   "user\_id": "522d2265-0532-4142-8079-0aa7e9c7d3cb", 

&#x20;   "course\_id": "69746c85-6109-4370-9334-1490cd2334b0", 

&#x20;   "assignment\_id": "CA5BF6EE-5DF4-40F0-ABEF-2DE57CA6BCCB", 

&#x20;   "answered\_questions": \[], 

&#x20;   "last\_response": \[], 

&#x20;   "current\_theta": 0 

&#x20;   }



Demo kết quả:

{

&#x20;   "next\_question": {

&#x20;       "choices": \[

&#x20;           {

&#x20;               "Content": "A) A collection of classes",

&#x20;               "Id": "09e2b58e-e34d-4814-bdb0-e27578a40671"

&#x20;           },

&#x20;           {

&#x20;               "Content": "B) A single class file",

&#x20;               "Id": "9c1bdb11-8d8c-4641-9e10-07fad8a486dc"

&#x20;           },

&#x20;           {

&#x20;               "Content": "C) A type of variable",

&#x20;               "Id": "fe726ac3-c0a2-4d39-934f-11b8be0dcd32"

&#x20;           },

&#x20;           {

&#x20;               "Content": "D) A method definition",

&#x20;               "Id": "47fd5f7a-113e-469b-a00d-2e619896de97"

&#x20;           }

&#x20;       ],

&#x20;       "content": "What is a package in Java?",

&#x20;       "question\_id": "95825e82-4400-4088-89f0-63f0370f2e1c"

&#x20;   },

&#x20;   "temp\_theta": 0.0

}



===================================

POST; http://127.0.0.1:5001/api/cat/submit

JSON body: 

{

&#x20; "user\_id": "522d2265-0532-4142-8079-0aa7e9c7d3cb",

&#x20; "course\_id": "69746c85-6109-4370-9334-1490cd2334b0",

&#x20; "assignment\_id": "CA5BF6EE-5DF4-40F0-ABEF-2DE57CA6BCCB",

&#x20; "answered\_questions": \[

&#x20;   "6EFA4102-A588-4931-91AF-00641458E7E8",

&#x20;   "CB049DBF-ACA1-4153-8FB6-009035412E47",

&#x20;   "E12A5BAB-C02C-479C-B61E-0727DA87B253"

&#x20; ],

&#x20; "responses": \[1, 0, 1],

&#x20; "smoothing\_alpha": 0.2

}



Quay về server chạy bình thường, chọn quiz -> làm quiz -> hiển thị kết quả -> lưu xuống database 

Kết quả cần đạt được 

* Hiển thị history ở trang pre-quiz
* Thực hành được 50 câu quiz ở mục Java Quiz Assignment
* Xem được kết quả, điểm số, trạng thái pass/fail, xem lại được lựa chọn 
* Lưu kết quả xuống database với các bang: CAT-Result, Submission, McqUserChoices, UserAbilities



Điểm cần update 

Xem lại lựa chọn của người học: đúng thì hiện xanh, sai thì hiện đỏ (không cần public tất cả đáp án đúng)

Sử dung AI để giải thich đáp án của người học đã chọn (đúng thì vì sao đúng, sai thì vì sao sai)

Fix lưu xuống CAT\_logs







