import React from "react";
import { Link } from "react-router-dom";
import {RiNotification3Line,RiArrowDownSLine,
         RiCheckboxBlankCircleFill} from "react-icons/ri"


export function Notifications (){

    return (
        <nav className="w-[70%] flex justify-end">
        <ul className="flex items-center gap-4">
            <li>
                <Link to="#" className="relative">
                <RiNotification3Line className="text-lg"/>
                <RiCheckboxBlankCircleFill className="absolute -right-1 -top-1 text-xs text-red-500"/>
                </Link>
            </li>
            <li>
                <Link to="#" className="flex items-center gap-1">
                Usuario
                <RiArrowDownSLine/>
                </Link>
              
            </li>
            
        </ul>
    
    </nav>

    )

}