/login                              ->      /api/auth/login
/changepassword                     ->      /api/auth/changepassword
/attendance/status                  ->      /api/attendance/status/:userId?
/attendance/checkin                 ->      /api/attendance/checkin
/attendance/checkout                ->      /api/attendance/checkout
/attendance/logs/:attendanceId?     ->      /api/attendance/logs
/attendance/locationlog             ->      /api/attendance/locationlog
/attendance/user                    ->      /api/attendance/user


/dailyexpenses                      ->      /api/dailyexpenses/add
/dailyexpenses                      ->      /api/dailyexpenses/update
/dailyexpenses                      ->      /api/dailyexpenses/:userId?     


/leaves/:userId?                    ->      /api/leaves/:userId
/leaveaction/:action?/:leaveId?     ->      /api/leaves/update/:action?/:leaveId?
/leaveapplication                   ->      /api/leaves/add



/saleslead/add                      ->      /api/saleslead/add
/saleslead/update/:wid              ->      /api/saleslead/update/:wid
/saleslead                          ->      /api/saleslead/get



/growerdetails                      ->      /api/growerdetails/get