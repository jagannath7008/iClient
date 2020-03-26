import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import {
  CommonService,
  IsValidType
} from "src/providers/common-service/common.service";
import { AjaxService } from "src/providers/ajax.service";
import { FormArray } from "@angular/forms";
import { FormControl, Validators } from "@angular/forms";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import * as $ from "jquery";
import {
  InvalidData,
  SuccessMessage,
  ZerothIndex
} from "src/providers/constants";
import { ClassDetail } from "../app.component";
import { ApplicationStorage } from "src/providers/ApplicationStorage";

@Component({
  selector: "app-attendance",
  templateUrl: "./attendance.component.html",
  styleUrls: ["./attendance.component.scss"]
})
export class AttendanceComponent implements OnInit {
  attendanceData: FormGroup;
  IsReady: boolean = false;
  ClassDetailUid: string;
  ClassDetail: Array<ClassDetail>;
  Sections: Array<ClassDetail>;
  Classes: Array<string>;
  dateModel: NgbDateStruct;
  SelecteClass: string;
  AttendanceSheet: Array<AttendanceSheetModal>;
  TodayDayNum: string;
  get AttendaceDetail(): FormArray {
    return this.attendanceData.get("AttendaceDetail") as FormArray;
  }
  constructor(
    private fb: FormBuilder,
    private http: AjaxService,
    private commonService: CommonService,
    private storage: ApplicationStorage
  ) {
    this.TodayDayNum = new Date().getDate().toString();
  }

  ngOnInit() {
    //this.UpdateAttendance();
    this.SelecteClass = "";
    this.ClassDetail = this.storage.GetClassDetail();
    this.Classes = this.storage.GetClasses();
    this.ClassDetailUid = "";
    this.selectDate(new Date());
    this.SelectDefault();
  }

  SelectDefault() {
    if (IsValidType(this.ClassDetail)) {
      let FirstItem = this.ClassDetail[ZerothIndex];
      this.BindSections(FirstItem.Class);
      this.SelecteClass = FirstItem.Class;
      this.ClassDetailUid = FirstItem.ClassDetailUid;
      this.LoadData();
    } else {
      this.InitAttendance();
      this.IsReady = true;
    }
  }

  selectDate(date: Date) {
    if (date !== null) {
      let selectedDate: NgbDateStruct = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };
      this.dateModel = selectedDate;
    }
  }

  SubmitAttendance() {
    if (IsValidType(this.attendanceData.controls.AttendaceDetail)) {
      let ServerData = this.attendanceData.controls.AttendaceDetail.value;
      this.http
        .post("AdminMaster/AddUpdateSingleClassAttendence", ServerData)
        .then(result => {
          if (IsValidType(result)) {
            this.commonService.ShowToast(SuccessMessage);
          } else {
            this.commonService.ShowToast(InvalidData);
          }
        });
    } else {
      this.commonService.ShowToast(InvalidData);
    }
  }

  UpdateAttendance() {
    let AttendanceList = this.LoadDemoData();
    this.http
      .post("AdminMaster/AddUpdateAttendence", AttendanceList)
      .then(result => {
        if (IsValidType(result.ResponseBody)) {
          let Data = JSON.parse(result.ResponseBody);
          if (IsValidType(Data["Table"])) {
            this.AttendanceSheet = Data["Table"];
            this.InitAttendance();
          } else {
            this.commonService.ShowToast(InvalidData);
          }
          this.commonService.ShowToast(SuccessMessage);
        } else {
          this.commonService.ShowToast(InvalidData);
        }
      });
  }

  LoadData() {
    this.http
      .post("AdminMaster/AttendenceByClassDetail", {
        ClassDetailUid: this.ClassDetailUid,
        CreatedOn: new Date(
          this.dateModel.year,
          this.dateModel.month,
          this.dateModel.day
        )
      })
      .then(result => {
        if (IsValidType(result.ResponseBody)) {
          let Data = JSON.parse(result.ResponseBody);
          if (IsValidType(Data["Table"])) {
            this.AttendanceSheet = Data["Table"];
            this.InitAttendance();
            this.IsReady = true;
          } else {
            this.commonService.ShowToast(InvalidData);
          }
          this.commonService.ShowToast(SuccessMessage);
        } else {
          this.commonService.ShowToast(InvalidData);
        }
      });
  }

  InitAttendance() {
    this.attendanceData = this.fb.group({
      AttendaceDetail: this.fb.array(this.BindStudentData())
    });
  }

  BindStudentData(): Array<FormGroup> {
    let index = 0;
    let Data: Array<FormGroup> = [];
    if (IsValidType(this.AttendanceSheet)) {
      while (index < this.AttendanceSheet.length) {
        Data.push(
          this.BuildStudentAttendanceDetail(this.AttendanceSheet[index])
        );
        index++;
      }
    }
    return Data;
  }

  BuildStudentAttendanceDetail(
    AttendanceData: AttendanceSheetModal
  ): FormGroup {
    return new FormGroup({
      StudentUid: new FormControl(AttendanceData.StudentUid),
      StudentName: new FormControl(
        `${AttendanceData.FirstName} ${AttendanceData.LastName}`
      ),
      ClassDetailUid: new FormControl(AttendanceData.ClassDetailUid),
      Class: new FormControl(AttendanceData.Class),
      Section: new FormControl(AttendanceData.Section),
      Date: new FormControl(new Date()),
      RollNo: new FormControl(AttendanceData.RollNo),
      IsPresent: new FormControl(
        AttendanceData[`Day${this.dateModel.day}`] === null ||
        AttendanceData[`Day${this.dateModel.day}`] === 0
          ? false
          : true
      )
    });
  }

  ToggleItem(studentUid: string) {
    if (studentUid !== null && studentUid !== "") {
      let $e = $(event.currentTarget).find('div[name="slider"]');
      if ($e.hasClass("off")) {
        $e.removeClass("off");
      } else {
        $e.addClass("off");
      }

      let Controls = this.attendanceData.get("AttendaceDetail")["controls"];
      let index = 0;
      let CurrentStudent: FormGroup = null;
      while (index < Controls.length) {
        if (Controls[index].controls.StudentUid.value === studentUid) {
          CurrentStudent = Controls[index];
          CurrentStudent.get("IsPresent").setValue(true);
          break;
        }
        index++;
      }
    } else {
      this.commonService.ShowToast(
        "Invalid student selected. Please contact to admin."
      );
    }
  }

  EnableSection() {
    this.Sections = [];
    let Class = $(event.currentTarget).val();
    this.BindSections(Class);
  }

  BindSections(Class) {
    if (IsValidType(Class)) {
      this.Sections = this.ClassDetail.filter(x => x.Class === Class);
      if (this.Sections.length === 0) {
        this.commonService.ShowToast("Unable to load class detail.");
      }
    }
  }

  ManageSection() {}

  ResetFilter() {}

  GetAdvanceFilter() {
    if (this.ClassDetailUid !== null && this.ClassDetailUid !== "") {
      this.LoadData();
    } else {
      this.commonService.ShowToast("Please select Class and Section.");
    }
  }

  LoadDemoData() {
    return [
      {
        AttendanceUid: "1584652021295",
        StudentUid: "1523370181157",
        TanentUid: "1523370179180",
        ClassDetailUid: "1523370179638",
        AttendanceMonth: 2,
        AttendanceYear: 2020,
        Day1: true,
        Day2: true,
        Day3: true,
        Day4: true,
        Day5: true,
        Day6: true,
        Day7: true,
        Day8: true,
        Day9: true,
        Day10: true,
        Day11: false,
        Day12: false,
        Day13: false,
        Day14: false,
        Day15: false,
        Day16: false,
        Day17: false,
        Day18: false,
        Day19: false,
        Day20: false,
        Day21: false,
        Day22: false,
        Day23: false,
        Day24: false,
        Day25: false,
        Day26: false,
        Day27: false,
        Day28: false,
        Day29: false,
        Day30: false,
        Day31: true,
        CreatedOn: new Date(),
        UpdatedOn: new Date(),
        CreatedBy: "1523370179393",
        UpdateBy: ""
      }
    ];
  }
}

class AttendanceModal {
  StudentUid: string = "";
  StudentName: string = "Test Student";
  ClassDetailUid: string = "876876757";
  Class?: number = 1;
  Section: string = "A";
  Date: string = "2/10/2020";
  IsPresent: boolean = false;
}

export interface AttendanceSheetModal {
  StudentUid: string;
  AttendanceUid: string;
  ClassDetailUid: string;
  FirstName: string;
  LastName: string;
  RollNo: number;
  Class: string;
  Section: string;
  TanentUid: string;
  AttendanceMonth: number;
  AttendanceYear: number;
  Day1: number;
  Day2: number;
  Day3: number;
  Day4: number;
  Day5: number;
  Day6: number;
  Day7: number;
  Day8: number;
  Day9: number;
  Day10: number;
  Day11: number;
  Day12: number;
  Day13: number;
  Day14: number;
  Day15: number;
  Day16: number;
  Day17: number;
  Day18: number;
  Day19: number;
  Day20: number;
  Day21: number;
  Day22: number;
  Day23: number;
  Day24: number;
  Day25: number;
  Day26: number;
  Day27: number;
  Day28: number;
  Day29: number;
  Day30: number;
  Day31: number;
  CreatedOn: string;
  UpdatedOn: string;
  CreatedBy: string;
  UpdateBy: string;
}
